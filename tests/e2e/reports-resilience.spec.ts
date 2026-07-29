import { test, expect } from "./fixtures";

test("renders coherent report totals, categories, empty state and history", async ({
  page,
  api,
  testData,
}) => {
  const accountResponse = await api.post("accounts", { data: testData.account });
  expect(accountResponse.status()).toBe(201);
  const account = await accountResponse.json();
  const emptyAccountResponse = await api.post("accounts", {
    data: testData.secondAccount,
  });
  expect(emptyAccountResponse.status()).toBe(201);
  const emptyAccount = await emptyAccountResponse.json();

  expect(
    (
      await api.post("transactions", {
        data: { ...testData.income, accountId: account.id, date: "2026-07-14" },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await api.post("transactions", {
        data: { ...testData.expense, accountId: account.id, date: "2026-07-15" },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await api.post("saving-goals", {
        data: { ...testData.savingGoal, accountId: account.id },
      })
    ).status(),
  ).toBe(201);

  await page.goto("/reports");
  await page.getByLabel("Select Account").selectOption(account.id);
  await expect(page.getByRole("article", { name: "Total Income" })).toContainText(
    "€1,250.50",
  );
  await expect(
    page.getByRole("article", { name: "Total Expenses" }),
  ).toContainText("€89.90");
  await expect(page.getByRole("article", { name: "Net Balance" })).toContainText(
    "€1,160.60",
  );
  await expect(page.getByRole("article", { name: "Transactions" })).toContainText(
    "2",
  );
  await expect(
    page.getByRole("heading", { name: "Expenses by Category" }),
  ).toBeVisible();
  await expect(page.getByText("Groceries")).toBeVisible();
  await expect(page.getByText("Salary")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Account Balance History" }),
  ).toBeVisible();
  await expect(page.getByText("NaN", { exact: true })).toHaveCount(0);

  await page.getByLabel("Select Account").selectOption(emptyAccount.id);
  await expect(page.getByRole("article", { name: "Net Balance" })).toContainText(
    "$0.00",
  );
  await expect(page.getByText("No expense data available.")).toBeVisible();
  await expect(page.getByText("No income data available.")).toBeVisible();
  await expect(page.getByText("No balance history available.")).toBeVisible();

  expect((await api.delete(`accounts/${emptyAccount.id}`)).status()).toBe(200);
  expect((await api.delete(`accounts/${account.id}`)).status()).toBe(200);
});

test("survives a controlled 500 response and recovers after reload", async ({
  page,
  api,
  testData,
}) => {
  const accountResponse = await api.post("accounts", { data: testData.account });
  expect(accountResponse.status()).toBe(201);
  const account = await accountResponse.json();
  const summaryPattern = "**/transactions/summary/*";

  await page.route(summaryPattern, (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Controlled report failure" }),
    }),
  );
  await page.goto("/reports");
  await expect(page.getByRole("alert")).toContainText(
    "Failed to load reports.",
  );
  await expect(page.getByText("NaN", { exact: true })).toHaveCount(0);

  await page.unroute(summaryPattern);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Net Balance" })).toContainText(
    "€0.00",
  );

  expect((await api.delete(`accounts/${account.id}`)).status()).toBe(200);
});
