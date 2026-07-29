import { test, expect } from "./fixtures";
import { API_URL } from "./support/environment";

test("creates, funds, edits, isolates, persists and deletes a savings goal", async ({
  page,
  api,
  testData,
}) => {
  const accountResponse = await api.post("accounts", { data: testData.account });
  expect(accountResponse.status()).toBe(201);
  const account = await accountResponse.json();

  const isolatedAccountResponse = await api.post("accounts", {
    data: testData.secondAccount,
  });
  expect(isolatedAccountResponse.status()).toBe(201);
  const isolatedAccount = await isolatedAccountResponse.json();

  expect(
    (
      await api.post("transactions", {
        data: { ...testData.income, accountId: account.id },
      })
    ).status(),
  ).toBe(201);

  const rejectedGoal = await api.post("saving-goals", {
    data: {
      ...testData.savingGoal,
      targetAmount: 0,
      accountId: account.id,
    },
  });
  expect(rejectedGoal.status()).toBe(400);
  const rejectedDeadline = await api.post("saving-goals", {
    data: {
      ...testData.savingGoal,
      deadline: "not-a-date",
      accountId: account.id,
    },
  });
  expect(rejectedDeadline.status()).toBe(400);

  await page.goto(`/accounts/${account.id}/saving-goals`);
  await page.getByRole("button", { name: "Create goal" }).click();
  const form = page.getByRole("form", { name: "New savings goal" });
  await form.getByLabel("Title").fill(testData.savingGoal.title);
  await form.getByLabel("Target amount").fill(testData.savingGoal.targetAmount);
  await form.getByLabel("Due date").fill(testData.savingGoal.deadline);
  await form.getByLabel("Notes").fill(testData.savingGoal.notes);
  const createResponse = page.waitForResponse(
    (candidate) =>
      candidate.url() === `${API_URL}/saving-goals` &&
      candidate.request().method() === "POST",
  );
  await form.getByRole("button", { name: "Create", exact: true }).click();
  expect((await createResponse).status()).toBe(201);

  const goal = page.getByRole("article", {
    name: testData.savingGoal.title,
  });
  await expect(goal).toBeVisible();
  await expect(goal).toContainText("0%");

  await goal
    .getByLabel(`Amount — ${testData.savingGoal.title}`)
    .fill("500.00");
  const addResponse = page.waitForResponse(
    (candidate) =>
      candidate.url().includes("/move-money") &&
      candidate.request().method() === "POST",
  );
  await goal.getByRole("button", { name: "Add money" }).click();
  expect((await addResponse).status()).toBe(200);
  await expect(goal).toContainText("10%");
  await expect(goal).toContainText("€500.00");

  await goal.getByRole("button", { name: "Edit" }).click();
  const editForm = page.getByRole("form", { name: "Edit savings goal" });
  const editedTitle = `Edited ${testData.savingGoal.title}`.slice(0, 40);
  await editForm.getByLabel("Title").fill(editedTitle);
  await editForm.getByLabel("Target amount").fill("4000.00");
  await editForm.getByRole("button", { name: "Update" }).click();

  const editedGoal = page.getByRole("article", { name: editedTitle });
  await expect(editedGoal).toBeVisible();
  await expect(editedGoal).toContainText("13%");

  await editedGoal.getByLabel(`Amount — ${editedTitle}`).fill("100.00");
  await editedGoal.getByRole("button", { name: "Remove money" }).click();
  await expect(editedGoal).toContainText("10%");
  await expect(editedGoal).toContainText("€400.00");

  const isolatedGoalResponse = await api.post("saving-goals", {
    data: {
      ...testData.savingGoal,
      title: `Isolated ${testData.savingGoal.title}`.slice(0, 40),
      accountId: isolatedAccount.id,
    },
  });
  expect(isolatedGoalResponse.status()).toBe(201);
  const isolatedGoal = await isolatedGoalResponse.json();
  await expect(page.getByText(isolatedGoal.title)).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("article", { name: editedTitle })).toContainText(
    "€400.00",
  );

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("article", { name: editedTitle })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByRole("article", { name: editedTitle })).toHaveCount(0);

  expect((await api.delete(`accounts/${isolatedAccount.id}`)).status()).toBe(200);
  expect((await api.delete(`accounts/${account.id}`)).status()).toBe(200);
});
