import { expect, test } from "@playwright/test";

test("renders the public home page and CTA links", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const heroSection = page.getByRole("region", {
    name: "Understand your money before it controls your month.",
  });

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Understand your money before it controls your month.",
    }),
  ).toBeVisible();
  await expect(
    heroSection.getByRole("link", { name: "Create account" }),
  ).toHaveAttribute("href", "/register");
  await expect(heroSection.getByRole("link", { name: "Log in" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("supports keyboard navigation, focus and browser history", async ({
  page,
}) => {
  await page.goto("/");
  const createAccount = page
    .getByRole("region", {
      name: "Understand your money before it controls your month.",
    })
    .getByRole("link", { name: "Create account" });

  await createAccount.focus();
  await expect(createAccount).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel("Full name:")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL("/");
  await page.goForward();
  await expect(page).toHaveURL(/\/register$/);
});

test("redirects protected routes to login for anonymous users", async ({
  page,
}) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Welcome back!" }),
  ).toBeVisible();
});

test("shows the not found page and links back home", async ({ page }) => {
  await page.goto("/this-route-does-not-exist", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { level: 2, name: "Page not found" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Go back home" }).click();
  await expect(page).toHaveURL("/");
});
