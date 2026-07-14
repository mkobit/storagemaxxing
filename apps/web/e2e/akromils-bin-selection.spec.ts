import { test, expect } from "@playwright/test";

// Journey 3 (docs/user-journeys.md, bead sm-s53j): try a different bin
// system in a space. golden-path.spec.ts and workshop-drawer-planning.spec.ts
// only cover Gridfinity; this file confirms the constraint editor and packer
// work end to end for a non-Gridfinity system (Akro-Mils), using the generic
// constraint-row-<binId>/add-bin-<binId> testids sm-ul0p added, which are
// keyed by bin id rather than being Gridfinity-specific.
//
// ConstraintEditorPanel detects which catalog to show via a heuristic (see
// its `detectedSystem`), not from the create-space-system field selected
// here -- that value is validated but otherwise discarded (see sm-s53j
// follow-up bug). The heuristic matches the literal substring "akromils"
// (no hyphen) in the space name, so the name below is deliberately spelled
// without Akro-Mils's usual hyphen to exercise the one path that works today.
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

  await page.getByTestId("create-space-name").fill("Akromils tool tray");
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
