import { expect, test } from "./fixtures.js";
import { fillRegistrationForm } from "./registration-helpers.js";

test("paciente fictício conclui cadastro e entra no painel local", async ({ page }) => {
  await page.goto("/cadastro");
  const patient = await fillRegistrationForm(page);

  await expect(page.getByLabel("CPF")).toHaveValue("174.839.205-05");
  await page.getByRole("button", { name: "Criar cadastro" }).click();

  await expect(page).toHaveURL(/\/login\?cadastro=sucesso$/);
  await expect(page.getByText("Cadastro realizado! Agora entre com seus dados.")).toBeVisible();

  await page.getByLabel("E-mail").fill(patient.email);
  await page.locator("#password").fill(patient.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Olá, seja bem-vindo!/ })).toBeVisible();
  await expect(page.getByText(`Olá, ${patient.name}!`)).toBeVisible();
});
