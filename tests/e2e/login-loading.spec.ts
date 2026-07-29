import { expect, test } from "@playwright/test";

test("shows immediate accessible login feedback and prevents duplicate submissions", async ({
  page,
}) => {
  let releaseRequest: (() => void) | undefined;
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  let loginRequests = 0;

  await page.route("**/auth/login", async (route) => {
    loginRequests += 1;
    await requestGate;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invalid credentials" }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("loading-state@example.test");
  await page.getByPlaceholder("Your password...").fill("not-a-real-password");

  const submitButton = page.getByRole("button", { name: "Log in" });
  await submitButton.click();

  const busyButton = page.getByRole("button", { name: "Signing in..." });
  await expect(busyButton).toBeDisabled();
  await expect(busyButton).toHaveAttribute("aria-busy", "true");
  const spinner = busyButton.locator("span[aria-hidden='true']").first();
  await expect
    .poll(() =>
      spinner.evaluate((element) => getComputedStyle(element).animationName),
    )
    .not.toBe("none");
  await expect.poll(() => loginRequests).toBe(1);

  releaseRequest?.();

  await expect(page.getByRole("status")).toContainText("Sign-in failed");
  await expect(submitButton).toBeEnabled();
  expect(loginRequests).toBe(1);
});

test("respects reduced motion for the login spinner", async ({ page }) => {
  let releaseRequest: (() => void) | undefined;
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/auth/login", async (route) => {
    await requestGate;
    await route.abort("failed");
  });
  await page.goto("/login");
  await page.getByLabel("Email").fill("reduced-motion@example.test");
  await page.getByPlaceholder("Your password...").fill("not-a-real-password");
  await page.getByRole("button", { name: "Log in" }).click();

  const spinner = page
    .getByRole("button", { name: "Signing in..." })
    .locator("span[aria-hidden='true']")
    .first();
  await expect(spinner).toBeVisible();
  await expect
    .poll(() =>
      spinner.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("none");

  releaseRequest?.();
  await expect(page.getByRole("status")).toContainText("Sign-in failed");
});

test("does not flash the login form while restoring a stored session", async ({
  page,
}) => {
  const storedUser = {
    id: "visual-session-user",
    name: "Visual Session",
    email: "visual-session@example.test",
    provider: "LOCAL",
  };
  let releaseSession: (() => void) | undefined;
  const sessionGate = new Promise<void>((resolve) => {
    releaseSession = resolve;
  });

  await page.addInitScript((user) => {
    localStorage.setItem("authToken", "visual-session-token");
    localStorage.setItem("authUser", JSON.stringify(user));
  }, storedUser);
  await page.route("**/users/me", async (route) => {
    await sessionGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(storedUser),
    });
  });

  await page.goto("/login");

  await expect(page.getByRole("status")).toContainText(
    "Checking your session...",
  );
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toHaveCount(
    0,
  );

  releaseSession?.();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toHaveCount(
    0,
  );
});
