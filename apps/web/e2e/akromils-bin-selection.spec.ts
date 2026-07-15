import { test, expect } from "@playwright/test";

// Journey 3 (docs/user-journeys.md, bead sm-s53j): try a different bin
// system in a space. golden-path.spec.ts and workshop-drawer-planning.spec.ts
// only cover Gridfinity; this file confirms the constraint editor and packer
// work end to end for a non-Gridfinity system (Akro-Mils), using the generic
// constraint-row-<binId>/add-bin-<binId> testids sm-ul0p added, which are
// keyed by bin id rather than being Gridfinity-specific.
//
// ConstraintEditorPanel used to detect which catalog to show via a
// name/templateId substring heuristic, ignoring the create-space-system field
// entirely (sm-s53j follow-up bug). sm-58a7 fixed this: SpaceInstance now
// carries an explicit `system` field set from the validated form input, and
// `detectedSystem` prefers it over the heuristic. The space name below is
// deliberately unrelated to "akromils" to prove the dropdown alone drives the
// filter now -- the heuristic remains only as a fallback for spaces without
// the field (e.g. golden-path demo fixtures).
//
// Only one Akro-Mils SKU (30010) is usable here: packages/catalog/src/
// akromils.ts sets `system: "akromils"` on 30010 alone, so every other
// Akro-Mils bin (and all 40 Schaller bins) is invisible to the Add Bins
// filter regardless of the detected system -- filed as sm-q0qk,
// discovered-from this bead.

test("Akro-Mils bin selection: a space named for a non-Gridfinity system packs an Akro-Mils SKU and updates validity", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Tool tray");
  await page.getByTestId("create-space-system").selectOption("akromils");
  await page.getByTestId("create-space-columns").fill("8");
  await page.getByTestId("create-space-rows").fill("6");
  await page.getByTestId("create-space-depth").fill("4");
  await page.getByTestId("create-space-submit").click();

  await page.getByTestId("add-bin-akromils-30010").click();
  const minInput = page
    .getByTestId("constraint-row-akromils-30010")
    .getByLabel("Min:");

  // Confirms the constraint row resolved a real Akro-Mils catalog entry
  // rather than falling back to the raw bin id.
  await expect(
    page.getByTestId("constraint-row-akromils-30010"),
  ).toContainText("Akro-Mils 30010");

  // Two bins at their actual ~3.9"x4.025" footprint fit an 8"x6" drawer
  // side by side.
  await minInput.fill("2");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  // Demanding far more than the drawer can hold invalidates the layout,
  // confirming the badge tracks Akro-Mils dimensions rather than always
  // reporting valid.
  await minInput.fill("500");
  await expect(page.getByTestId("layout-validity-badge")).not.toHaveText(
    "valid",
  );

  await minInput.fill("2");
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
});

// sm-58a7's exact repro: a space name that shares no substring with any
// system name must still filter the Add Bins catalog by the selected
// dropdown value alone, not fall back to Gridfinity.
test("create-space-system dropdown alone drives the Add Bins catalog filter, independent of the space name", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Kitchen drawer");
  await page.getByTestId("create-space-system").selectOption("schaller");
  await page.getByTestId("create-space-columns").fill("10");
  await page.getByTestId("create-space-rows").fill("10");
  await page.getByTestId("create-space-depth").fill("3");
  await page.getByTestId("create-space-submit").click();

  await expect(page.getByTestId("add-bin-schaller-1x1x2")).toBeVisible();
  await expect(page.getByTestId("add-bin-gridfinity-1x1x2")).toHaveCount(0);
});
