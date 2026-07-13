import { test, expect } from "@playwright/test";

// Journey 1 (docs/user-journeys.md, bead sm-ul0p): plan a single drawer
// before buying bins. Drives the real CreateSpaceFormPanel and
// ConstraintEditorPanel UI end to end, unlike golden-path.spec.ts, which
// exercises the same packing/validity logic through the synthetic
// GoldenPathSetup CI fixture buttons.

test("Workshop drawer planning: real dimensions, a chosen system, and hard-min bin counts tell the planner whether everything they wanted fits", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Workshop drawer");
  await page.getByTestId("create-space-system").selectOption("gridfinity");
  await page.getByTestId("create-space-columns").fill("14");
  await page.getByTestId("create-space-rows").fill("10");
  await page.getByTestId("create-space-depth").fill("2");
  await page.getByTestId("create-space-submit").click();

  // Add the two bin types the planner wants, then bump each from the
  // default hard-min of 1 up to the count they actually need.
  await page.getByTestId("add-bin-gridfinity-2x2x2").click();
  await page.getByTestId("add-bin-gridfinity-1x1x2").click();

  await page
    .getByTestId("constraint-row-gridfinity-2x2x2")
    .getByLabel("Min:")
    .fill("2");
  await page
    .getByTestId("constraint-row-gridfinity-1x1x2")
    .getByLabel("Min:")
    .fill("3");

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
});
