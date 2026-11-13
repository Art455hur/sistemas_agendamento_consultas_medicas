import { expect, test } from "./fixtures.js";

test("iniciar agendamento pela especialidade preserva a escolha no login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Cardiologia/ }).click();
  await page.getByRole("dialog", { name: "Cardiologia" })
    .getByRole("link", { name: "Agendar consulta" })
    .click();

  await expect(page).toHaveURL(/\/login\?especialidade=Cardiologia$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
});
