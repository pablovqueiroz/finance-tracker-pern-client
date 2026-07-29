import { test, expect } from "./fixtures";
import {
  deleteUser,
  loginUser,
  registerUser,
} from "./support/api";
import { API_URL } from "./support/environment";

test("creates, opens, edits and switches accounts through the UI", async ({
  page,
  api,
  testData,
}) => {
  await page.goto("/create-account");
  await page.getByLabel("Title:").fill(testData.account.name);
  await page
    .getByLabel("Description:")
    .fill(testData.account.description);
  const currency = page.getByRole("combobox");
  await expect(currency).toHaveAccessibleName(/^Currency:?$/);
  await currency.selectOption(testData.account.currency);

  const createdResponse = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/accounts` &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create account" }).click();
  const created = await (await createdResponse).json();
  await expect(page).toHaveURL(/\/accounts$/);
  const createdCard = page
    .getByRole("article")
    .filter({ hasText: testData.account.description });
  await expect(
    createdCard.getByRole("heading", { name: testData.account.name }),
  ).toBeVisible();

  const secondResponse = await api.post("accounts", {
    data: testData.secondAccount,
  });
  expect(secondResponse.status()).toBe(201);
  const second = await secondResponse.json();
  await page.reload();
  const secondCard = page
    .getByRole("article")
    .filter({ hasText: testData.secondAccount.description });
  await expect(
    secondCard.getByRole("heading", { name: testData.secondAccount.name }),
  ).toBeVisible();
  await secondCard
    .getByRole("heading", { name: testData.secondAccount.name })
    .click();
  await expect(page).toHaveURL(new RegExp(`/accounts/${second.id}$`));
  await expect(
    page.getByRole("heading", { name: testData.secondAccount.name }),
  ).toBeVisible();

  await page.goto(`/accounts/${created.id}`);
  await page.getByRole("button", { name: "Edit" }).click();
  const updatedName = `Updated ${testData.runId}`.slice(0, 20);
  await page.getByPlaceholder("Account name").fill(updatedName);
  await page.getByPlaceholder("Description").fill("Updated by Playwright");
  await page.getByRole("combobox").selectOption("GBP");
  const updateResponse = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/accounts/${created.id}` &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save" }).click();
  expect((await updateResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();
  await expect(page.getByText("British Pound")).toBeVisible();

  expect((await api.delete(`accounts/${created.id}`)).status()).toBe(200);
  expect((await api.delete(`accounts/${second.id}`)).status()).toBe(200);
});

test("enforces OWNER, ADMIN and MEMBER permissions and account isolation", async ({
  api,
  request,
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

  const adminData = testData.secondUser;
  const memberData = {
    ...testData.secondUser,
    name: `Member ${testData.runId}`,
    email: `member-${testData.runId}@example.test`,
    password: `${testData.secondUser.password}-member`,
  };
  const outsiderData = {
    ...testData.secondUser,
    name: `Outsider ${testData.runId}`,
    email: `outsider-${testData.runId}@example.test`,
    password: `${testData.secondUser.password}-outsider`,
  };
  for (const user of [adminData, memberData, outsiderData]) {
    expect((await registerUser(request, user)).status()).toBe(201);
  }
  const admin = await loginUser(request, adminData);
  const member = await loginUser(request, memberData);
  const outsider = await loginUser(request, outsiderData);

  const adminInviteResponse = await api.post("invites", {
    data: {
      email: adminData.email,
      accountId: account.id,
      role: "ADMIN",
    },
  });
  expect(adminInviteResponse.status()).toBe(201);
  const adminInvite = await adminInviteResponse.json();
  const memberInviteResponse = await api.post("invites", {
    data: {
      email: memberData.email,
      accountId: account.id,
      role: "MEMBER",
    },
  });
  expect(memberInviteResponse.status()).toBe(201);
  const memberInvite = await memberInviteResponse.json();

  const acceptInvite = (authToken: string, token: string) =>
    request.post(`${API_URL}/invites/${token}/accept`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  expect(
    (await acceptInvite(admin.authToken, adminInvite.token)).status(),
  ).toBe(200);
  expect(
    (await acceptInvite(member.authToken, memberInvite.token)).status(),
  ).toBe(200);

  const memberUpdate = await request.put(
    `${API_URL}/accounts/${account.id}`,
    {
      headers: { Authorization: `Bearer ${member.authToken}` },
      data: { description: "Member tampering attempt" },
    },
  );
  expect(memberUpdate.status()).toBe(403);

  const adminUpdate = await request.put(
    `${API_URL}/accounts/${account.id}`,
    {
      headers: { Authorization: `Bearer ${admin.authToken}` },
      data: { description: "Updated by admin" },
    },
  );
  expect(adminUpdate.status()).toBe(200);

  const outsiderRead = await request.get(
    `${API_URL}/accounts/${account.id}`,
    {
      headers: { Authorization: `Bearer ${outsider.authToken}` },
    },
  );
  expect(outsiderRead.status()).toBe(403);
  const outsiderPayloadTampering = await request.post(
    `${API_URL}/transactions`,
    {
      headers: { Authorization: `Bearer ${outsider.authToken}` },
      data: {
        ...testData.expense,
        amount: Number(testData.expense.amount),
        accountId: account.id,
      },
    },
  );
  expect(outsiderPayloadTampering.status()).toBe(403);

  const membersResponse = await api.get(`accounts/${account.id}/members`);
  expect(membersResponse.status()).toBe(200);
  const members = await membersResponse.json();
  const memberMembership = members.find(
    (entry: { userId: string }) => entry.userId === member.user.id,
  );
  expect(memberMembership).toBeTruthy();
  const roleUpdate = await api.patch(
    `accounts/${account.id}/members/${memberMembership.id}`,
    { data: { role: "ADMIN" } },
  );
  expect(roleUpdate.status()).toBe(200);

  const crossAccountMemberId = await api.patch(
    `accounts/${isolatedAccount.id}/members/${memberMembership.id}`,
    { data: { role: "MEMBER" } },
  );
  expect(crossAccountMemberId.status()).toBe(404);

  expect((await api.delete(`accounts/${account.id}`)).status()).toBe(200);
  expect(
    (await api.delete(`accounts/${isolatedAccount.id}`)).status(),
  ).toBe(200);
  await deleteUser(request, admin.authToken, adminData.password);
  await deleteUser(request, member.authToken, memberData.password);
  await deleteUser(request, outsider.authToken, outsiderData.password);
});
