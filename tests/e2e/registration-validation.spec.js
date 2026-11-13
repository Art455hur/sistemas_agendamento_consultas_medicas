import { expect, test } from "./fixtures.js";
import { fillRegistrationForm } from "./registration-helpers.js";

test("cadastro exige os dados obrigatórios", async ({ page }) => {
  await page.goto("/cadastro");
  await page.getByRole("button", { name: "Criar cadastro" }).click();

  await expect.poll(() => page.locator("#name").evaluate((input) => input.validity.valueMissing)).toBe(true);
  await expect(page.locator(".auth-message")).toHaveCount(0);
});

test("cadastro apresenta erro para CPF inválido", async ({ page }) => {
  await page.goto("/cadastro");
  await fillRegistrationForm(page, { cpf: "11111111111" });

  await expect(page.getByLabel("CPF")).toHaveValue("111.111.111-11");
  await page.getByRole("button", { name: "Criar cadastro" }).click();

  await expect(page.getByText("Digite um CPF válido.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/cadastro$/);
});
