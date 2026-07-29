import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const userId = randomUUID();
const accountId = randomUUID();
const user = {
  id: userId,
  name: "Performance User",
  email: "performance@example.test",
  gender: null,
  image: "",
  provider: "LOCAL",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

async function mockDashboardRequests(
  page: Page,
  counters: { currentUser: number; summaries: number },
) {
  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname === "/api/users/me") {
      counters.currentUser += 1;
      await route.fulfill({ json: user });
      return;
    }

    if (pathname === "/api/accounts") {
      await route.fulfill({
        json: [
          {
            id: accountId,
            name: "Main account",
            description: "",
            currency: "EUR",
            balance: 0,
            users: [],
            _count: { transactions: 0, savingGoals: 0 },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      });
      return;
    }

    if (pathname.startsWith("/api/transactions/summary/")) {
      counters.summaries += 1;
      await route.fulfill({ json: {} });
      return;
    }

    if (pathname === "/api/invites/received") {
      await route.fulfill({ json: [] });
      return;
    }

    if (pathname === `/api/transactions/account/${accountId}`) {
      await route.fulfill({ json: [] });
      return;
    }

    if (pathname === `/api/accounts/${accountId}`) {
      await route.fulfill({
        json: {
          id: accountId,
          name: "Main account",
          description: "",
          currency: "EUR",
          users: [],
        },
      });
      return;
    }

    await route.fulfill({
      status: 404,
      json: { message: "Unexpected request" },
    });
  });
}

test("uses the login response across logout and reauthentication without re-fetching the current user", async ({
  page,
}) => {
  const counters = { currentUser: 0, summaries: 0 };
  let loginRequests = 0;

  await mockDashboardRequests(page, counters);
  await page.route("**/api/auth/login", async (route) => {
    loginRequests += 1;
    await route.fulfill({
      json: { authToken: "test-token", user },
    });
  });

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder("Your email...").fill(user.email);
  await page.getByPlaceholder("Your password...").fill("valid-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Main account", exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  expect(loginRequests).toBe(1);
  expect(counters.currentUser).toBe(0);

  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  expect(
    await page.evaluate(() => ({
      token: localStorage.getItem("authToken"),
      user: localStorage.getItem("authUser"),
    })),
  ).toEqual({ token: null, user: null });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder("Your email...").fill(user.email);
  await page.getByPlaceholder("Your password...").fill("valid-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState("networkidle");

  expect(loginRequests).toBe(2);
  expect(counters.currentUser).toBe(0);
});

test("initializes a stored session once and does not request per-account summaries", async ({
  page,
}) => {
  const counters = { currentUser: 0, summaries: 0 };

  await page.addInitScript(
    ({ authUser }) => {
      localStorage.setItem("authToken", "stored-test-token");
      localStorage.setItem("authUser", JSON.stringify(authUser));
    },
    { authUser: user },
  );
  await mockDashboardRequests(page, counters);

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Main account", exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  expect(counters.currentUser).toBe(1);
  expect(counters.summaries).toBe(0);
});
