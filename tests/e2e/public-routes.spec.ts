import { expect, test } from "@playwright/test";

test("renders the public home page and CTA links", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const heroSection = page.locator("section").first();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Understand your money before it controls your month.",
    }),
  ).toBeVisible();
  await expect(
    heroSection.getByRole("link", { name: "Create Account" }),
  ).toHaveAttribute("href", "/register");
  await expect(heroSection.getByRole("link", { name: "Login" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("redirects protected routes to login for anonymous users", async ({
  page,
}) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Welcome Back!" }),
  ).toBeVisible();
});

test("shows the not found page and links back home", async ({ page }) => {
  await page.goto("/this-route-does-not-exist", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { level: 2, name: "Page Not Found" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Go Back Home" }).click();
  await expect(page).toHaveURL("/");
});
