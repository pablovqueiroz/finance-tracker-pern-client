import {
  expect as expectAuthenticated,
  test as authenticatedTest,
} from "./fixtures";

authenticatedTest(
  "separates account loading, error, retry and empty states",
  async ({ page }) => {
    let accountRequests = 0;

    await page.route("**/api/accounts", async (route) => {
      accountRequests += 1;

      if (accountRequests === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Controlled accounts failure" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/accounts");

    await expectAuthenticated(
      page.getByRole("alert").getByText("Failed to load accounts."),
    ).toBeVisible();
    const requestsBeforeRetry = accountRequests;
    await page.getByRole("button", { name: "Try again" }).click();
    await expectAuthenticated(
      page.getByText("No accounts available yet."),
    ).toBeVisible();
    expectAuthenticated(accountRequests).toBe(requestsBeforeRetry + 1);
  },
);
