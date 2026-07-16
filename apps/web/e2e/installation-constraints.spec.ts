import { test, expect } from "@playwright/test";

// sm-6tip: scope narrowed to the noDrill-unset default path. No real catalog
// bin is a defensible installation.type "drill" product yet (Gridfinity
// snaps into baseplates, Schaller/Akro-Mils are freestanding/rail-mount) --
// see sm-6tip's comment thread for the investigation. The drill-exclusion
// path itself is covered at the unit/component level in packages/store and
// ConstraintEditorPanel's test suites (sm-5xj6, sm-l8x4) against a synthetic
// drill bin. This spec only guards that the toggle exists, defaults to
// drillable, and that flipping it has no visible effect on real bins today.
test("drillable toggle defaults to on and leaves real bins unaffected", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Drill toggle check");
  await page.getByTestId("create-space-system").selectOption("schaller");
  await page.getByTestId("create-space-columns").fill("24");
  await page.getByTestId("create-space-rows").fill("24");
  await page.getByTestId("create-space-depth").fill("3");
  await page.getByTestId("create-space-submit").click();

  const toggle = page.getByTestId("drillable-toggle");
  await expect(toggle).toBeChecked();

  const addButton = page.getByTestId("add-bin-schaller-1x1x2");
  await expect(addButton).toBeEnabled();

  // Toggling noDrill on/off must not grey or disable a bin with no
  // installation requirement -- isBinInstallationAllowed always passes it.
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(addButton).toBeEnabled();

  await addButton.click();
  await expect(page.getByTestId("constraint-row-schaller-1x1x2")).toBeVisible();

  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(addButton).toBeDisabled(); // already added, not installation-excluded
  await expect(page.getByTestId("constraint-row-schaller-1x1x2")).toBeVisible();
});
