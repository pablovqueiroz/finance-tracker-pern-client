import { test, expect } from "./fixtures";
import { deleteUser, loginUser, registerUser } from "./support/api";
import { API_URL } from "./support/environment";

test("sends and accepts invites, rejects invalid states and records safe audit data", async ({
  page,
  api,
  request,
  testData,
}) => {
  const accountResponse = await api.post("accounts", { data: testData.account });
  expect(accountResponse.status()).toBe(201);
  const account = await accountResponse.json();

  const memberData = testData.secondUser;
  const pendingData = {
    ...testData.secondUser,
    name: `Pending ${testData.runId}`,
    email: `pending-${testData.runId}@example.test`,
    password: `${testData.secondUser.password}-pending`,
  };
  expect((await registerUser(request, memberData)).status()).toBe(201);
  expect((await registerUser(request, pendingData)).status()).toBe(201);
  const member = await loginUser(request, memberData);
  const pending = await loginUser(request, pendingData);

  await page.goto(`/invites?accountId=${account.id}`);
  const sendButton = page.getByRole("button", { name: "Send invite" });
  await expect(sendButton).toBeEnabled();
  await page.getByLabel("Email").fill(memberData.email);
  await page.getByLabel("Role").selectOption("ADMIN");
  await page
    .getByRole("combobox", { name: /^Account/ })
    .selectOption(account.id);
  const inviteResponsePromise = page.waitForResponse(
    (candidate) =>
      candidate.url() === `${API_URL}/invites` &&
      candidate.request().method() === "POST",
  );
  await sendButton.click();
  const inviteResponse = await inviteResponsePromise;
  expect(inviteResponse.status()).toBe(201);
  const invite = await inviteResponse.json();
  await expect(
    page.getByRole("dialog", { name: "Share invite" }),
  ).toBeVisible();

  const duplicate = await api.post("invites", {
    data: {
      email: memberData.email,
      accountId: account.id,
      role: "ADMIN",
    },
  });
  expect(duplicate.status()).toBe(400);

  const received = await request.get(`${API_URL}/invites/received`, {
    headers: { Authorization: `Bearer ${member.authToken}` },
  });
  expect(received.status()).toBe(200);
  expect(
    (await received.json()).some(
      (candidate: { id: string }) => candidate.id === invite.id,
    ),
  ).toBe(true);

  const accepted = await request.post(
    `${API_URL}/invites/${invite.token}/accept`,
    { headers: { Authorization: `Bearer ${member.authToken}` } },
  );
  expect(accepted.status()).toBe(200);
  const members = await (await api.get(`accounts/${account.id}/members`)).json();
  expect(
    members.find(
      (candidate: { userId: string; role: string }) =>
        candidate.userId === member.user.id && candidate.role === "ADMIN",
    ),
  ).toBeTruthy();

  const expiringResponse = await api.post("invites", {
    data: {
      email: pendingData.email,
      accountId: account.id,
      role: "MEMBER",
    },
  });
  expect(expiringResponse.status()).toBe(201);
  const expiringInvite = await expiringResponse.json();
  expect(
    (await api.patch(`invites/${expiringInvite.id}/expire`)).status(),
  ).toBe(200);
  expect(
    (
      await request.post(
        `${API_URL}/invites/${expiringInvite.token}/accept`,
        { headers: { Authorization: `Bearer ${pending.authToken}` } },
      )
    ).status(),
  ).toBe(400);

  const cancellingResponse = await api.post("invites", {
    data: {
      email: pendingData.email,
      accountId: account.id,
      role: "MEMBER",
    },
  });
  expect(cancellingResponse.status()).toBe(201);
  const cancellingInvite = await cancellingResponse.json();
  expect(
    (await api.patch(`invites/${cancellingInvite.id}/cancel`)).status(),
  ).toBe(200);
  expect(
    (
      await request.post(
        `${API_URL}/invites/${cancellingInvite.token}/accept`,
        { headers: { Authorization: `Bearer ${pending.authToken}` } },
      )
    ).status(),
  ).toBe(400);

  const currentUser = await (await api.get("users/me")).json();
  const auditedTransactionResponse = await api.post("transactions", {
    data: { ...testData.income, accountId: account.id },
  });
  expect(auditedTransactionResponse.status()).toBe(201);
  const auditedTransaction = await auditedTransactionResponse.json();
  expect(
    (
      await api.put(`transactions/${auditedTransaction.id}`, {
        data: { title: `Audited ${testData.income.title}`.slice(0, 40) },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await api.delete(`transactions/${auditedTransaction.id}`)).status(),
  ).toBe(200);

  const auditResponse = await api.get(`accounts/${account.id}/audit-logs`);
  expect(auditResponse.status()).toBe(200);
  const logs = await auditResponse.json();
  expect(
    logs.some(
      (log: {
        action: string;
        entityType: string;
        entityId: string;
        performedById: string;
        accountId: string;
      }) =>
        log.action === "CREATE" &&
        log.entityType === "AccountInvite" &&
        log.entityId === invite.id &&
        log.accountId === account.id,
    ),
  ).toBe(true);
  const transactionLogs = logs.filter(
    (log: { entityType: string; entityId: string }) =>
      log.entityType === "Transaction" &&
      log.entityId === auditedTransaction.id,
  );
  expect(
    new Set(
      transactionLogs.map((log: { action: string }) => log.action),
    ),
  ).toEqual(new Set(["CREATE", "UPDATE", "DELETE"]));
  expect(
    transactionLogs.every(
      (log: { performedById: string; accountId: string }) =>
        log.performedById === currentUser.id && log.accountId === account.id,
    ),
  ).toBe(true);
  expect(
    logs.some(
      (log: {
        action: string;
        entityType: string;
        entityId: string;
        performedById: string;
      }) =>
        log.action === "UPDATE" &&
        log.entityType === "AccountInvite" &&
        log.entityId === invite.id &&
        log.performedById === member.user.id,
    ),
  ).toBe(true);
  const serializedLogs = JSON.stringify(logs);
  expect(serializedLogs).not.toContain(invite.token);
  expect(serializedLogs).not.toContain(cancellingInvite.token);
  expect(serializedLogs).not.toContain(memberData.password);

  expect((await api.delete(`accounts/${account.id}`)).status()).toBe(200);
  await deleteUser(request, member.authToken, memberData.password);
  await deleteUser(request, pending.authToken, pendingData.password);
});
