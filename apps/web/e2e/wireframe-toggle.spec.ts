import { test, expect } from "@playwright/test";

test("wireframe toggle flips rendering mode without disturbing validity", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-starter-bins").click();

  const canvas = page.locator("canvas");
  const badge = page.getByTestId("layout-validity-badge");
  const toggle = page.getByTestId("wireframe-toggle");

  await expect(canvas).toBeVisible();
  await expect(badge).toHaveText("valid");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();

  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(canvas).toBeVisible();
  await expect(badge).toHaveText("valid");

  await toggle.click();

  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(canvas).toBeVisible();
  await expect(badge).toHaveText("valid");
});
