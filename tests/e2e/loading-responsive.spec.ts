import { expect, test } from "./fixtures";

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

test("keeps dashboard loading and empty states stable across target viewports", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("downloadable font: download failed")
    ) {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  let releaseAccounts: (() => void) | undefined;
  const accountsGate = new Promise<void>((resolve) => {
    releaseAccounts = resolve;
  });

  await page.route("**/api/accounts", async (route) => {
    await accountsGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.setViewportSize(viewports[0]);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toContainText("Loading...");

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }

  releaseAccounts?.();

  await expect(
    page.getByRole("heading", { name: "Create a new account" }),
  ).toBeVisible();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }

  expect(browserErrors).toEqual([]);
});
