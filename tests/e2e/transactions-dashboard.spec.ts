import { test, expect } from "./fixtures";
import { API_URL } from "./support/environment";

test("creates, filters, edits, persists and deletes financial transactions", async ({
  page,
  api,
  testData,
}) => {
  const accountResponse = await api.post("accounts", {
    data: testData.account,
  });
  expect(accountResponse.status()).toBe(201);
  const account = await accountResponse.json();
  const isolatedAccountResponse = await api.post("accounts", {
    data: testData.secondAccount,
  });
  expect(isolatedAccountResponse.status()).toBe(201);
  const isolatedAccount = await isolatedAccountResponse.json();

  await page.goto(`/accounts/${account.id}/transactions`);

  const createTransaction = async (transaction: typeof testData.income) => {
    await page
      .getByRole("button", { name: "Create transaction" })
      .click();
    const dialog = page.getByRole("dialog", { name: "New transaction" });
    await dialog.getByLabel("Title").fill(transaction.title);
    await dialog.getByLabel("Amount").fill(transaction.amount);
    await dialog.getByLabel("Type").selectOption(transaction.type);
    await dialog.getByLabel("Category").selectOption(transaction.category);
    await dialog.getByLabel("Date").fill("2026-07-15");
    await dialog.getByLabel("Notes").fill(transaction.notes);
    const response = page.waitForResponse(
      (candidate) =>
        candidate.url() === `${API_URL}/transactions` &&
        candidate.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    expect((await response).status()).toBe(201);
    await expect(page.getByRole("status")).toContainText(
      "Transaction created.",
    );
  };

  await createTransaction(testData.income);
  await createTransaction(testData.expense);
  const incomeCard = page.getByRole("group", { name: testData.income.title });
  const expenseCard = page.getByRole("group", {
    name: testData.expense.title,
  });
  await expect(incomeCard).toBeVisible();
  await expect(expenseCard).toBeVisible();

  await page
    .getByPlaceholder("Search by title, type, amount, category or notes")
    .fill(testData.income.title);
  await expect(incomeCard).toBeVisible();
  await expect(expenseCard).toBeHidden();
  await page
    .getByPlaceholder("Search by title, type, amount, category or notes")
    .clear();
  await page.getByLabel("Category filter").selectOption("GROCERIES");
  await expect(expenseCard).toBeVisible();
  await expect(incomeCard).toBeHidden();
  await page.getByLabel("Category filter").selectOption("");

  await incomeCard.getByRole("button", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit transaction" });
  const updatedTitle = `Edited ${testData.income.title}`.slice(0, 40);
  await editDialog.getByLabel("Title").fill(updatedTitle);
  await editDialog.getByLabel("Amount").fill("1300.75");
  const updateResponse = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "PUT" &&
      candidate.url().startsWith(`${API_URL}/transactions/`),
  );
  await editDialog.getByRole("button", { name: "Update" }).click();
  const updatedResponse = await updateResponse;
  expect(updatedResponse.request().postDataJSON().title).toBe(updatedTitle);
  expect(updatedResponse.status()).toBe(200);
  await expect(
    page.getByRole("group", { name: updatedTitle }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Create transaction" })
    .click();
  const cancelDialog = page.getByRole("dialog", { name: "New transaction" });
  await cancelDialog.getByLabel("Title").fill(`Cancelled ${testData.runId}`);
  await cancelDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(cancelDialog).toBeHidden();

  page.once("dialog", (dialog) => dialog.accept());
  const deleteResponse = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "DELETE" &&
      candidate.url().startsWith(`${API_URL}/transactions/`),
  );
  await expenseCard.getByRole("button", { name: "Delete" }).click();
  expect((await deleteResponse).status()).toBe(200);
  await expect(expenseCard).toBeHidden();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("group", { name: updatedTitle }),
  ).toBeVisible();

  const isolatedTransaction = await api.post("transactions", {
    data: {
      ...testData.expense,
      amount: Number(testData.expense.amount),
      accountId: isolatedAccount.id,
      date: "2026-07-16",
    },
  });
  expect(isolatedTransaction.status()).toBe(201);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("group", { name: testData.expense.title }),
  ).toBeHidden();

  const invalidAmount = await api.post("transactions", {
    data: {
      ...testData.expense,
      amount: 0,
      accountId: account.id,
    },
  });
  expect(invalidAmount.status()).toBe(400);

  await page.goto("/dashboard");
  await expect(
    page
      .getByRole("link", { includeHidden: true })
      .filter({ hasText: testData.account.description }),
  ).toContainText("€1,300.75");
  await expect(page.getByText("NaN", { exact: true })).toHaveCount(0);

  expect((await api.delete(`accounts/${account.id}`)).status()).toBe(200);
  expect((await api.delete(`accounts/${isolatedAccount.id}`)).status()).toBe(
    200,
  );
});
