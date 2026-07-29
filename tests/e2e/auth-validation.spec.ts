import { expect, test } from "@playwright/test";

test("validates empty login submission on the client", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Please fill in all fields.",
  );
});

test("validates mismatched passwords during registration", async ({ page }) => {
  await page.goto("/register", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Full Name:").fill("Playwright Smoke");
  await page.getByLabel("Email:").fill("playwright@example.com");
  await page.getByPlaceholder(/^Your password\.\.\.$/).fill("secret123");
  await page.getByPlaceholder(/^Repeat your password\.\.\.$/).fill("secret321");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Passwords do not match.",
  );
});
