import { test, expect } from "@playwright/test";

test("toggling the theme updates the .dark class and survives a reload", async ({
  page,
}) => {
  await page.goto("/");

  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/);
});

test("a corrupted stored theme preference degrades to system default", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("storagemaxxing-theme", "not-a-real-theme");
  });
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByTestId("toolbar")).toBeVisible();
});
