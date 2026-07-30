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

// sm-njs6: these two scenarios exercise the drill-exclusion path itself,
// which requires a catalog bin with installation.type "drill" -- no real
// catalog SKU qualifies (see sm-6tip above), so they run only against the
// chromium-e2e-fixtures project, whose dev server aliases
// @storagemaxxing/catalog/lookup to e2e/fixtures/catalogWithDrillFixture.ts
// (adding a synthetic "test-drill-bin"). The default chromium project
// excludes @drill-fixture-tagged tests via playwright.config.ts's
// grepInvert, since add-bin-test-drill-bin doesn't exist against its
// real-catalog dev server.
test(
  "drill-mount bin is disabled in Add Bins once noDrill is set",
  { tag: "@drill-fixture" },
  async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("create-space-name").fill("Drill exclusion check");
    await page.getByTestId("create-space-system").selectOption("gridfinity");
    await page.getByTestId("create-space-columns").fill("8");
    await page.getByTestId("create-space-rows").fill("8");
    await page.getByTestId("create-space-depth").fill("2");
    await page.getByTestId("create-space-submit").click();

    const toggle = page.getByTestId("drillable-toggle");
    await expect(toggle).toBeChecked();

    const addButton = page.getByTestId("add-bin-test-drill-bin");
    await expect(addButton).toBeEnabled();

    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect(addButton).toBeDisabled();
  },
);

test(
  "drill-mount bin already added is dropped from packed layout once noDrill is set",
  { tag: "@drill-fixture" },
  async ({ page }) => {
    await page.goto("/");

    await page
      .getByTestId("create-space-name")
      .fill("Drill exclusion packing check");
    await page.getByTestId("create-space-system").selectOption("gridfinity");
    await page.getByTestId("create-space-columns").fill("8");
    await page.getByTestId("create-space-rows").fill("8");
    await page.getByTestId("create-space-depth").fill("2");
    await page.getByTestId("create-space-submit").click();

    await expect(page.getByTestId("drillable-toggle")).toBeChecked();

    await page.getByTestId("add-bin-test-drill-bin").click();
    await expect(
      page.getByTestId("constraint-row-test-drill-bin"),
    ).toBeVisible();

    await page.getByRole("button", { name: "BOM" }).click();
    const bomPanel = page.getByTestId("bom-panel");
    await expect(
      bomPanel.locator("tr", { hasText: "TEST-DRILL-1" }),
    ).toBeVisible();

    // ConstraintEditorPanel (and its drillable-toggle) renders outside the
    // Layout/BOM/Options tab switch, so it stays reachable with the BOM tab
    // still active -- no tab change needed.
    await page.getByTestId("drillable-toggle").click();
    await expect(
      bomPanel.locator("tr", { hasText: "TEST-DRILL-1" }),
    ).toHaveCount(0);
  },
);
