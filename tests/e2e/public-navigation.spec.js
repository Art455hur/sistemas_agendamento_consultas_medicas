import { expect, test } from "./fixtures.js";

test("menu inicial leva o visitante às telas de login e cadastro", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();

  await page.getByRole("link", { name: "Criar uma conta" }).click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
});
