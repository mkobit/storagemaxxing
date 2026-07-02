import { test, expect } from "@playwright/test";

test("ConstraintEditorPanel has the glass panel treatment in both themes", async ({
  page,
}) => {
  await page.goto("/");

  const panel = page.getByTestId("constraint-editor-panel");
  await expect(panel).toHaveCSS("backdrop-filter", /^(?!none$)/);

  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(panel).toHaveCSS("backdrop-filter", /^(?!none$)/);
});
