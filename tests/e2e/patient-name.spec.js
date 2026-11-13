import { expect, test } from "./fixtures.js";
import { demoPatient, fillRegistrationForm } from "./registration-helpers.js";

const error = "Informe um nome entre 3 e 120 caracteres.";

test("cadastro rejeita nome curto e excessivo sem persistir dados locais", async ({ page }) => {
  await page.goto("/cadastro");
  await fillRegistrationForm(page);
  for (const name of ["  Al  ", "A".repeat(121)]) {
    await page.getByLabel("Nome completo").fill(name);
    await page.getByRole("button", { name: "Criar cadastro" }).click();
    await expect(page.getByText(error, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("registeredUser"))).toBeNull();
    await expect(page).toHaveURL(/\/cadastro$/);
  }
});

test("perfil local rejeita nome curto e salva nome válido sem espaços externos", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate((patient) => {
    localStorage.setItem("profile", JSON.stringify(patient));
    localStorage.setItem("registeredUser", JSON.stringify(patient));
    localStorage.setItem("authToken", "sessao-ficticia-teste");
  }, demoPatient);
  await page.goto("/perfil");
  const name = page.getByLabel("Nome completo");
  await expect(name).toHaveValue(demoPatient.name);
  await name.fill("  Al  ");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText(error, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("profile")).name)).toBe(demoPatient.name);
  await name.fill("  Ana  ");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Perfil atualizado com sucesso!", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome completo")).toHaveValue("Ana");
});
