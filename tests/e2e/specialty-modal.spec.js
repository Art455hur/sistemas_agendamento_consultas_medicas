import { expect, test } from "./fixtures.js";

test("modal de especialidade mostra detalhes e fecha pelo botão", async ({ page }) => {
  await page.goto("/");
  const previousOverflow = await page.locator("body").evaluate((body) => body.style.overflow);

  await page.getByRole("button", { name: /Cardiologia/ }).click();

  const dialog = page.getByRole("dialog", { name: "Cardiologia" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Avaliação cardiológica")).toBeVisible();
  await expect.poll(() => page.locator("body").evaluate((body) => body.style.overflow)).toBe("hidden");

  await page.getByRole("button", { name: "Fechar detalhes" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => page.locator("body").evaluate((body) => body.style.overflow)).toBe(previousOverflow);
});

test("modal de especialidade fecha pela tecla Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Ortopedia/ }).click();
  await expect(page.getByRole("dialog", { name: "Ortopedia" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toHaveCount(0);
});
