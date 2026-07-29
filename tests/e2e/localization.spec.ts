import { expect, test } from "@playwright/test";
import { createTestData } from "./support/testData";
import {
  deleteUser,
  loginUser,
  registerUser,
} from "./support/api";

const localizedHomeHeadings = {
  en: "Understand your money before it controls your month.",
  pt: "Percebe o teu dinheiro antes que ele controle o teu mês.",
  es: "Entiende tu dinero antes de que controle tu mes.",
} as const;

test("loads every supported language without exposing translation keys", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  for (const [language, heading] of Object.entries(localizedHomeHeadings)) {
    await page.evaluate((selectedLanguage) => {
      localStorage.setItem("i18nextLng", selectedLanguage);
    }, language);
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /\b(?:common|home|auth|nav|accounts|transactionsPage|savingGoals)\.[A-Za-z]/,
    );
  }
});

test("switches language immediately and persists the choice after reload", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: /^Language:/ }).click();
  await page.getByRole("menuitemradio", { name: "Portuguese" }).click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: localizedHomeHeadings.pt,
    }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: localizedHomeHeadings.pt,
    }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("i18nextLng")))
    .toBe("pt");
});

test("keeps the longer Spanish interface within the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "es");
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: localizedHomeHeadings.es,
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});

test("preserves language after logout and login", async ({
  page,
  request,
}, testInfo) => {
  const data = createTestData(testInfo.workerIndex);
  const registration = await registerUser(request, data.user);
  expect(registration.status()).toBe(201);
  const session = await loginUser(request, data.user);

  try {
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem("authToken", token);
        localStorage.setItem("authUser", JSON.stringify(user));
      },
      { token: session.authToken, user: session.user },
    );
    await page.goto("/profile");

    if (testInfo.project.name.startsWith("mobile-")) {
      await page
        .getByRole("button", { name: "Open profile menu" })
        .click();
      await page.getByRole("button", { name: "ES", exact: true }).click();
    } else {
      await page
        .getByRole("button", { name: "Open profile menu" })
        .click();
      await page.getByRole("button", { name: /^Language:/ }).click();
      await page.getByRole("menuitemradio", { name: "Spanish" }).click();
    }

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL("/");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("i18nextLng")))
      .toBe("es");

    await page.getByRole("link", { name: "Entrar" }).first().click();
    await page.getByPlaceholder("Tu correo...").fill(data.user.email);
    await page.getByPlaceholder("Tu contraseña...").fill(data.user.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Mi perfil" }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("i18nextLng")))
      .toBe("es");
  } finally {
    await deleteUser(request, session.authToken, data.user.password);
  }
});
