import { test, expect } from "@playwright/test";

test("BOMPanel has the glass panel treatment in both themes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "BOM" }).click();

  const panel = page.getByTestId("bom-panel");
  await expect(panel).toHaveCSS("backdrop-filter", /^(?!none$)/);

  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(panel).toHaveCSS("backdrop-filter", /^(?!none$)/);
});
