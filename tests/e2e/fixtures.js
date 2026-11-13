import { expect, test as playwrightTest } from "@playwright/test";

export const test = playwrightTest.extend({
  page: async ({ page }, use) => {
    await page.route("**/*", (route) => {
      const requestUrl = new URL(route.request().url());
      const isLocalTestServer =
        requestUrl.origin === process.env.PLAYWRIGHT_TEST_BASE_URL;

      return isLocalTestServer ? route.continue() : route.abort();
    });

    await use(page);
  },
});

export { expect };
