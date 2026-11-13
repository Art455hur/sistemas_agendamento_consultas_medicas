import { expect, test } from "./fixtures.js";

test("login orienta quando ainda não existe usuário de demonstração", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("paciente@example.test");
  await page.locator("#password").fill("senha-ficticia");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page.getByText("Nenhum usuário cadastrado. Crie uma conta primeiro.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("login rejeita senha incorreta no modo de demonstração", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.setItem("registeredUser", JSON.stringify({
      name: "Paciente de Teste",
      email: "paciente@example.test",
      password: "senha-correta-ficticia",
    }));
  });

  await page.getByLabel("E-mail").fill("paciente@example.test");
  await page.locator("#password").fill("senha-incorreta-ficticia");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
