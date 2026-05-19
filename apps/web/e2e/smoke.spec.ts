import { test, expect } from "@playwright/test";

test("has toolbar and shows home page", async ({ page }) => {
  await page.goto("/");

  // Check for the toolbar using data-testid
  const toolbar = page.getByTestId("toolbar");
  await expect(toolbar).toBeVisible();

  // Check for the mode select button
  const selectBtn = page.getByTestId("mode-select");
  await expect(selectBtn).toBeVisible();
  await expect(selectBtn).toHaveText("Select");
});
