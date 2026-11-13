import { expect, test } from "./fixtures.js";

test("rota privada encaminha visitante e mantém o destino solicitado", async ({ page }) => {
  await page.goto("/agendamentos?aba=cancelled");

  await expect(page).toHaveURL(/\/login\?redirect=%2Fagendamentos%3Faba%3Dcancelled$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
});
