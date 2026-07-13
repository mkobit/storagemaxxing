import { test, expect } from "@playwright/test";

// Journey 4 (docs/user-journeys.md, bead sm-4857): tweak a constraint and
// see it update immediately. golden-path.spec.ts already covers the mode
// edit ("changing a constraint's mode refreshes the validity badge"); this
// file covers the other two edit types named in the scenario -- a bin's
// count and the bin choice itself -- on a space that already has a packed
// layout, without redoing the space setup.

const setUpWorkshopDrawer = async (
  page: import("@playwright/test").Page,
): Promise<void> => {
  await page.goto("/");
  await page.getByTestId("create-space-name").fill("Workshop drawer");
  await page.getByTestId("create-space-system").selectOption("gridfinity");
  await page.getByTestId("create-space-columns").fill("14");
  await page.getByTestId("create-space-rows").fill("10");
  await page.getByTestId("create-space-depth").fill("2");
  await page.getByTestId("create-space-submit").click();
};

test("changing a bin's count refreshes an already-packed layout without redoing setup", async ({
  page,
}) => {
  await setUpWorkshopDrawer(page);

  await page.getByTestId("add-bin-gridfinity-2x2x2").click();
  const minInput = page
    .getByTestId("constraint-row-gridfinity-2x2x2")
    .getByLabel("Min:");
  await minInput.fill("2");

  const badge = page.getByTestId("layout-validity-badge");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(badge).toHaveText("valid");

  // Bump the hard-min count well past what a 14x10in drawer can hold --
  // the existing layout should invalidate immediately, with no re-submit
  // of the space form or re-add of the bin.
  await minInput.fill("200");
  await expect(badge).not.toHaveText("valid");

  // Bringing the count back down recovers validity, confirming the badge
  // tracks the live constraint rather than latching on the earlier failure.
  await minInput.fill("2");
  await expect(badge).toHaveText("valid");
});

test("swapping the bin choice refreshes an already-packed layout without redoing setup", async ({
  page,
}) => {
  await setUpWorkshopDrawer(page);

  await page.getByTestId("add-bin-gridfinity-2x2x2").click();
  await page
    .getByTestId("constraint-row-gridfinity-2x2x2")
    .getByLabel("Min:")
    .fill("200");

  const badge = page.getByTestId("layout-validity-badge");
  await expect(badge).not.toHaveText("valid");

  // Swap the bin choice: drop the oversized 2x2x2 requirement and add a
  // different bin type instead, on the same already-packed space.
  await page
    .getByTestId("constraint-row-gridfinity-2x2x2")
    .getByTitle("Remove constraint")
    .click();
  await expect(
    page.getByTestId("constraint-row-gridfinity-2x2x2"),
  ).toHaveCount(0);

  await page.getByTestId("add-bin-gridfinity-1x1x2").click();

  await expect(
    page.getByTestId("constraint-row-gridfinity-1x1x2"),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(badge).toHaveText("valid");
});
