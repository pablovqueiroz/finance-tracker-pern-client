import { test, expect } from "./fixtures";
import { API_URL } from "./support/environment";

test("updates and persists profile fields through the form", async ({
  page,
  api,
  testData,
}) => {
  const originalResponse = await api.get("users/me");
  expect(originalResponse.status()).toBe(200);
  const original = await originalResponse.json();
  const updatedName = `Profile ${testData.runId}`.slice(0, 40);

  await page.goto("/profile");
  const form = page.getByRole("form", { name: "My Profile" });
  await form.getByLabel("Name").fill(updatedName);
  await form.getByLabel("Gender").selectOption("OTHER");
  const updateResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/users/me` &&
      response.request().method() === "PUT",
  );
  const saveButton = form.getByRole("button", { name: "Save profile" });
  await saveButton.click();
  expect((await updateResponsePromise).status()).toBe(200);
  await expect(page.getByRole("status")).toContainText(
    "Profile updated successfully.",
  );

  await page.reload();
  await expect(page.getByRole("form", { name: "My Profile" }).getByLabel("Name"))
    .toHaveValue(updatedName);
  await expect(
    page.getByRole("form", { name: "My Profile" }).getByLabel("Gender"),
  ).toHaveValue("OTHER");

  const restoreResponse = await api.put("users/me", {
    data: { name: original.name, gender: original.gender ?? "" },
  });
  expect(restoreResponse.status()).toBe(200);
});
