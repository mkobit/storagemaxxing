import { test, expect, type Page } from "@playwright/test";

// Journey 2 (docs/user-journeys.md, bead sm-ez18): plan a whole tool chest
// and get one shopping list. Multi-space (space-manager.spec.ts) and
// aggregate BOM (bom-panel.spec.ts) are each tested separately; this drives
// them together end to end.

const createSpace = async (
  page: Page,
  options: { name: string; columns: number; rows: number; depth: number },
) => {
  await page.getByTestId("create-space-name").fill(options.name);
  await page.getByTestId("create-space-system").selectOption("gridfinity");
  await page.getByTestId("create-space-columns").fill(String(options.columns));
  await page.getByTestId("create-space-rows").fill(String(options.rows));
  await page.getByTestId("create-space-depth").fill(String(options.depth));
  await page.getByTestId("create-space-submit").click();
};

// Pins a hard constraint to an exact count (Min === Max) so the packer's
// auto-fill phase — which only tops up constraints left without a max —
// doesn't add extra bins beyond what the test asserts on.
const addBinWithExactCount = async (
  page: Page,
  binId: string,
  count: number,
) => {
  await page.getByTestId(`add-bin-${binId}`).click();
  const row = page.getByTestId(`constraint-row-${binId}`);
  await row.getByLabel("Min:").fill(String(count));
  await row.getByLabel("Max:").fill(String(count));
};

const bomQuantityFor = (page: Page, sku: string) =>
  page
    .getByTestId("bom-panel")
    .locator("tr", { hasText: sku })
    .locator("td")
    .nth(2);

test("planning a whole tool chest aggregates bin quantities from every space into one BOM", async ({
  page,
}) => {
  await page.goto("/");

  await createSpace(page, {
    name: "Top drawer",
    columns: 10,
    rows: 6,
    depth: 2,
  });
  await addBinWithExactCount(page, "gridfinity-1x1x2", 6);
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  await createSpace(page, {
    name: "Bottom drawer",
    columns: 8,
    rows: 8,
    depth: 2,
  });
  await addBinWithExactCount(page, "gridfinity-2x2x2", 4);
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  await page.getByRole("button", { name: "BOM" }).click();

  const panel = page.getByTestId("bom-panel");
  await expect(panel.locator("tbody tr")).toHaveCount(2);
  await expect(bomQuantityFor(page, "GF-112")).toHaveText("6");
  await expect(bomQuantityFor(page, "GF-222")).toHaveText("4");
});
