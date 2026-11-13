import { expect, test } from "./fixtures.js";

test("página inicial apresenta a proposta e as especialidades", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Sua saúde, no seu tempo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Especialidades disponíveis" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Cardiologia/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ortopedia/ })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
