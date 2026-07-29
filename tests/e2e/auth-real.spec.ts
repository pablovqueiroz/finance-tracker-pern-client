import { expect, test } from "@playwright/test";
import {
  deleteUser,
  loginUser,
  registerUser,
} from "./support/api";
import { API_URL } from "./support/environment";
import { createTestData } from "./support/testData";

test.use({ storageState: { cookies: [], origins: [] } });

test("registers a valid user through the form", async ({
  page,
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);

  await page.goto("/register");
  await page.getByLabel("Full Name:").fill(data.user.name);
  await page.getByLabel("Gender").selectOption(data.user.gender);
  await page.getByLabel("Email:").fill(data.user.email);
  await page
    .getByPlaceholder("Your password...", { exact: true })
    .fill(data.user.password);
  await page
    .getByPlaceholder("Repeat your password...")
    .fill(data.user.password);

  const registrationResponse = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/auth/register` &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Register" }).click();
  expect((await registrationResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/login$/);

  const session = await loginUser(request, data.user);
  await deleteUser(request, session.authToken, data.user.password);
});

test("enforces required fields and browser email validation", async ({
  page,
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);

  await page.goto("/register");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Please fill in name, email and password.",
  );

  await page.getByLabel("Full Name:").fill(data.user.name);
  await page.getByLabel("Email:").fill("invalid-email");
  await page
    .getByPlaceholder("Your password...", { exact: true })
    .fill(data.user.password);
  await page
    .getByPlaceholder("Repeat your password...")
    .fill(data.user.password);
  await page.getByRole("button", { name: "Register" }).click();

  await expect
    .poll(() =>
      page
        .getByLabel("Email:")
        .evaluate((element) => (element as HTMLInputElement).checkValidity()),
    )
    .toBe(false);
  await expect(page).toHaveURL(/\/register$/);

  await page.getByLabel("Email:").fill(data.user.email);
  await page
    .getByPlaceholder("Your password...", { exact: true })
    .fill("short");
  await page.getByPlaceholder("Repeat your password...").fill("short");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Password must be at least 6 characters long.",
  );

  const directRegistration = await request.post(`${API_URL}/auth/register`, {
    data: {
      ...data.user,
      password: "short",
      confirmPassword: "short",
    },
  });
  expect(directRegistration.status()).toBe(400);
});

test("rejects a duplicate email through the form", async ({
  page,
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);
  expect((await registerUser(request, data.user)).status()).toBe(201);

  await page.goto("/register");
  await page.getByLabel("Full Name:").fill(data.user.name);
  await page.getByLabel("Email:").fill(data.user.email);
  await page
    .getByPlaceholder("Your password...", { exact: true })
    .fill(data.user.password);
  await page
    .getByPlaceholder("Repeat your password...")
    .fill(data.user.password);
  const duplicateResponse = page.waitForResponse(
    (response) => response.url() === `${API_URL}/auth/register`,
  );
  await page.getByRole("button", { name: "Register" }).click();

  expect((await duplicateResponse).status()).toBe(400);
  await expect(page.getByRole("status")).toContainText("Sign-up failed");

  const session = await loginUser(request, data.user);
  await deleteUser(request, session.authToken, data.user.password);
});

test("logs in once, persists after reload, logs out and blocks access", async ({
  page,
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);
  expect((await registerUser(request, data.user)).status()).toBe(201);
  let loginRequests = 0;
  let currentUserRequests = 0;
  page.on("request", (requestEvent) => {
    if (
      requestEvent.url() === `${API_URL}/auth/login` &&
      requestEvent.method() === "POST"
    ) {
      loginRequests += 1;
    }
    if (requestEvent.url() === `${API_URL}/users/me`) {
      currentUserRequests += 1;
    }
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder("Your email...").fill(data.user.email);
  await page
    .getByPlaceholder("Your password...", { exact: true })
    .fill(data.user.password);
  const submit = page.getByRole("button", { name: "Log in" });
  const loginRequest = page.waitForRequest(`${API_URL}/auth/login`);
  const loginResponse = page.waitForResponse(`${API_URL}/auth/login`);
  const disabledState = submit.evaluate(
    (element) =>
      new Promise<boolean>((resolve) => {
        const button = element as HTMLButtonElement;
        if (button.disabled) {
          resolve(true);
          return;
        }
        const observer = new MutationObserver(() => {
          if (button.disabled) {
            observer.disconnect();
            resolve(true);
          }
        });
        observer.observe(button, {
          attributes: true,
          attributeFilter: ["disabled"],
        });
      }),
  );
  await submit.evaluate((button) => {
    const form = button.closest("form");
    form?.requestSubmit();
    form?.requestSubmit();
  });
  await loginRequest;
  expect(await disabledState).toBe(true);
  const response = await loginResponse;
  const session = await response.json();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState("networkidle");
  expect(loginRequests).toBe(1);
  expect(currentUserRequests).toBe(1);

  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await deleteUser(request, session.authToken, data.user.password);
});

test("returns a generic error for an invalid password", async ({
  page,
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);
  expect((await registerUser(request, data.user)).status()).toBe(201);

  await page.goto("/login");
  await page.getByPlaceholder("Your email...").fill(data.user.email);
  await page
    .getByPlaceholder("Your password...", { exact: true })
    .fill(`${data.user.password}-wrong`);
  const response = page.waitForResponse(`${API_URL}/auth/login`);
  await page.getByRole("button", { name: "Log in" }).click();

  expect((await response).status()).toBe(401);
  await expect(page.getByRole("status")).toContainText("Sign-in failed");

  const session = await loginUser(request, data.user);
  await deleteUser(request, session.authToken, data.user.password);
});
