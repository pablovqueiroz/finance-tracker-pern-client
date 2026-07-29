import { randomUUID } from "node:crypto";

export type E2ETestData = ReturnType<typeof createTestData>;

export function createTestData(workerIndex: number) {
  const uniqueId = `${workerIndex}-${randomUUID().slice(0, 8)}`;
  const runId = `${Date.now()}-${uniqueId}`;
  const password = `E2e-${runId}-Aa1!`;

  return {
    runId,
    user: {
      name: `Playwright User ${runId}`,
      email: `playwright-${runId}@example.test`,
      password,
      gender: "PREFER_NOT_TO_SAY",
    },
    secondUser: {
      name: `Playwright Member ${runId}`,
      email: `playwright-member-${runId}@example.test`,
      password: `${password}-Member`,
      gender: "NON_BINARY",
    },
    account: {
      name: `E2E Account ${uniqueId}`.slice(0, 20),
      description: `E2E account ${runId}`.slice(0, 60),
      currency: "EUR",
    },
    secondAccount: {
      name: `E2E Other ${uniqueId}`.slice(0, 20),
      description: `Isolation account ${runId}`.slice(0, 60),
      currency: "USD",
    },
    income: {
      title: `Income ${runId}`.slice(0, 40),
      amount: "1250.50",
      type: "INCOME",
      category: "SALARY",
      notes: `Income notes ${runId}`,
    },
    expense: {
      title: `Expense ${runId}`.slice(0, 40),
      amount: "89.90",
      type: "EXPENSE",
      category: "GROCERIES",
      notes: `Expense notes ${runId}`,
    },
    savingGoal: {
      title: `Emergency ${runId}`.slice(0, 40),
      targetAmount: "5000.00",
      currentAmount: "500.00",
      deadline: "2030-12-31",
      notes: `Goal notes ${runId}`,
    },
  };
}
