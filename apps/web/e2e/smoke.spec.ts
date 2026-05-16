import { test, expect } from "@playwright/test";

test("Smoke Test: app loads and shows title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/StorageMaxxing/);
});
