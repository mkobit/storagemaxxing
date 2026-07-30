import { test, expect, type Page } from "@playwright/test";

// Journey 5 (docs/user-journeys.md, bead sm-5pjs): resume a plan later.
// golden-path.spec.ts already covers reload and export/import round-trips
// against the single-space golden-path fixture; this drives the same two
// paths against a real multi-space plan -- two spaces, each with its own
// dimensions and bin constraint -- asserting every space is restored
// independently, not just whichever was active when the sketch was saved.

const SPACES = [
  {
    name: "Top drawer",
    columns: 10,
    rows: 6,
    depth: 2,
    binId: "gridfinity-1x1x2",
    count: 6,
  },
  {
    name: "Bottom drawer",
    columns: 8,
    rows: 8,
    depth: 2,
    binId: "gridfinity-2x2x2",
    count: 4,
  },
] as const;

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
// auto-fill phase -- which only tops up constraints left without a max --
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

const buildBothSpaces = async (page: Page) => {
  await page.goto("/");
  for (const space of SPACES) {
    await createSpace(page, space);
    await addBinWithExactCount(page, space.binId, space.count);
    await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
  }
};

const assertSpaceRestored = async (
  page: Page,
  space: (typeof SPACES)[number],
) => {
  await page
    .getByTestId("space-manager")
    .getByRole("button", { name: space.name })
    .click();

  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
  await expect(page.locator("canvas")).toBeVisible();

  const row = page.getByTestId(`constraint-row-${space.binId}`);
  await expect(row).toBeVisible();
  await expect(row.getByLabel("Min:")).toHaveValue(String(space.count));
  await expect(row.getByLabel("Max:")).toHaveValue(String(space.count));
};

// Zustand's persist middleware writes to IndexedDB asynchronously; wait for
// the write to land before reloading so hydration has something to read.
const waitForIndexedDbWrite = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string | null>((resolve) => {
            const req = indexedDB.open("keyval-store");
            req.onsuccess = () => {
              const getReq = req.result
                .transaction("keyval", "readonly")
                .objectStore("keyval")
                .get("storagemaxxing-db");
              getReq.onsuccess = () => resolve(getReq.result ?? null);
              getReq.onerror = () => resolve(null);
            };
            req.onerror = () => resolve(null);
          }),
      ),
    )
    .not.toBeNull();

test("multi-space sketch persists across a page reload", async ({ page }) => {
  await buildBothSpaces(page);
  await waitForIndexedDbWrite(page);

  await page.reload();

  for (const space of SPACES) {
    await assertSpaceRestored(page, space);
  }
});

test("exports and re-imports a multi-space sketch to restore every space exactly", async ({
  page,
  browser,
}) => {
  await buildBothSpaces(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-sketch").click(),
  ]);
  const exportedPath = await download.path();
  expect(exportedPath).toBeTruthy();

  // Fresh browser context so there's no persisted IndexedDB state to
  // interfere -- both spaces below must come from the imported file.
  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.goto("/");
  await freshPage
    .getByTestId("import-sketch-input")
    .setInputFiles(exportedPath!);

  for (const space of SPACES) {
    await assertSpaceRestored(freshPage, space);
  }

  await freshContext.close();
});
