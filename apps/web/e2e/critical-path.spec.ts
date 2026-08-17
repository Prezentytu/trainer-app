import { expect, test } from "@playwright/test";

const email = process.env.E2E_TRAINER_EMAIL ?? "";
const password = process.env.E2E_TRAINER_PASSWORD ?? "";
const hasAuth = Boolean(email && password);

test.describe("public", () => {
  test("landing i ekran logowania", async ({ page }) => {
    await page.goto("/");

    const vercelWall = page.getByRole("heading", { name: /Log in to Vercel/i });
    if (await vercelWall.isVisible().catch(() => false)) {
      throw new Error(
        "Vercel Authentication zasłania Preview. Wyłącz je w Settings → Deployment Protection.",
      );
    }

    await expect(page.getByRole("heading", { name: /Wysyłasz link/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Zaloguj się|Załóż darmowe konto|Załóż konto/i }).first(),
    ).toBeVisible();

    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /Zaloguj się|Logowanie/i })).toBeVisible();
  });
});

test.describe("trener", () => {
  test.skip(!hasAuth, "Ustaw E2E_TRAINER_EMAIL i E2E_TRAINER_PASSWORD w Environment dev.");

  test("klienci → kreator planu → link portalu", async ({ page }) => {
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const { setupClerkTestingToken } = await import("@clerk/testing/playwright");
        await setupClerkTestingToken({ page });
      } catch {
        /* token testowy jest opcjonalny — logowanie hasłem nadal działa */
      }
    }

    await page.goto("/sign-in");
    await page.getByLabel("Adres e-mail").fill(email);
    await page.getByLabel("Hasło").fill(password);
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 25_000 });

    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: "Klienci" })).toBeVisible();

    const stamp = `E2E ${Date.now()}`;
    await page.getByRole("button", { name: "Dodaj klienta" }).click();
    await page.getByLabel(/Imię i nazwisko/).fill(stamp);
    await page.getByRole("button", { name: "Dodaj klienta" }).last().click();
    await expect(page.getByText(stamp).first()).toBeVisible();

    await page.goto("/plans/new");
    await expect(page.getByRole("heading", { name: "Nowy plan" })).toBeVisible();
    await page.getByRole("button", { name: /Zacznij od jednego dnia/ }).click();
    await page.getByRole("button", { name: /Przejdź do kreatora/ }).click();
    await expect(page.getByRole("heading", { name: "Nowy plan" })).toBeVisible();

    await page.goto("/clients");
    await page.getByText(stamp).first().click();
    await expect(page.getByRole("button", { name: /Skopiuj link/ })).toBeVisible();
  });
});
