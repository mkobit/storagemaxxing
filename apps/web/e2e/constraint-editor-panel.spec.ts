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

// sm-aj77: with 2+ constraint rows, the bin-name span's flex-item
// min-width used to resolve to 0 (the classic min-width:auto +
// overflow:hidden collapse) once the row's natural content width
// exceeded the 320px panel, silently hiding the name. jsdom/happy-dom
// don't run real layout, so only a real-browser bounding-box check
// catches this -- toContainText alone (used elsewhere) passes either way.
test("constraint row bin names stay visible with 2+ rows in the real 320px panel", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Schaller width check");
  await page.getByTestId("create-space-system").selectOption("schaller");
  await page.getByTestId("create-space-columns").fill("24");
  await page.getByTestId("create-space-rows").fill("24");
  await page.getByTestId("create-space-depth").fill("3");
  await page.getByTestId("create-space-submit").click();

  await page.getByTestId("add-bin-schaller-1x1x2").click();
  await page.getByTestId("add-bin-schaller-1x1x3").click();

  const firstName = page
    .getByTestId("constraint-row-schaller-1x1x2")
    .locator("span")
    .first();
  const secondName = page
    .getByTestId("constraint-row-schaller-1x1x3")
    .locator("span")
    .first();

  await expect(firstName).toHaveText("Schaller 1x2 - 1 inch depth");
  await expect(secondName).toHaveText("Schaller 1x3 - 1 inch depth");

  const firstBox = await firstName.boundingBox();
  const secondBox = await secondName.boundingBox();

  expect(firstBox?.width).toBeGreaterThan(0);
  expect(secondBox?.width).toBeGreaterThan(0);
});
