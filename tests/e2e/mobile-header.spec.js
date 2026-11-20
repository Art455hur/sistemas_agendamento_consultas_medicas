import { expect, test } from "./fixtures.js";

test("cabeçalho mantém login e cadastro acessíveis em tela estreita", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");

  const header = page.getByRole("banner");
  const login = header.getByRole("link", { name: "Entrar", exact: true });
  const registration = header.getByRole("link", { name: "Criar conta", exact: true });
  await expect(login).toBeInViewport();
  await expect(registration).toBeInViewport();
  expect(await header.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(320);

  await registration.click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
});
