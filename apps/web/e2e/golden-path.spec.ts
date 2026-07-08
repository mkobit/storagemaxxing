import { test, expect } from "@playwright/test";

// Fill colors assigned to the starter constraints in GoldenPathSetup.tsx.
const STARTER_COLORS = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759"];
// Matches LayoutCanvas.tsx's VIEWPORT_MARGIN_PX: the fit-to-viewport contract
// (layout-fit-to-viewport) guarantees rendered content stays within the
// canvas inset by this margin on every edge, regardless of scale.
const VIEWPORT_MARGIN_PX = 20;

test("user selects a system and bins and sees a packed layout", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-starter-bins").click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  await expect
    .poll(
      async () =>
        page.evaluate(
          ({ colors, marginPx }) => {
            const canvas = document.querySelector("canvas");
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return [];
            const { data } = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const toHex = (v: number) => v.toString(16).padStart(2, "0");
            const found = new Map<string, { maxX: number; maxY: number }>();
            for (let i = 0; i < data.length; i += 4) {
              const hex = `#${toHex(data[i])}${toHex(data[i + 1])}${toHex(data[i + 2])}`;
              if (!colors.includes(hex)) continue;
              const px = (i / 4) % canvas.width;
              const py = Math.floor(i / 4 / canvas.width);
              const cur = found.get(hex) ?? { maxX: 0, maxY: 0 };
              found.set(hex, {
                maxX: Math.max(cur.maxX, px),
                maxY: Math.max(cur.maxY, py),
              });
            }
            return [...found.entries()]
              .filter(
                ([, m]) =>
                  m.maxX <= canvas.width - marginPx &&
                  m.maxY <= canvas.height - marginPx,
              )
              .map(([hex]) => hex)
              .sort();
          },
          { colors: STARTER_COLORS, marginPx: VIEWPORT_MARGIN_PX },
        ),
      { timeout: 10_000 },
    )
    .toEqual([...STARTER_COLORS].sort());
});

test("non-valid pack surfaces a non-valid validity badge", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-tiny-starter-bins").click();
  await expect(page.locator("canvas")).toBeVisible();

  const badge = page.getByTestId("layout-validity-badge");
  await expect(badge).toBeVisible();
  await expect(badge).not.toHaveText("valid");
});

test("partial pack surfaces a partial validity badge", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-partial-starter-bins").click();
  await expect(page.locator("canvas")).toBeVisible();

  const badge = page.getByTestId("layout-validity-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText("partial");
});

test("unresolved bin ID surfaces unresolved count badge", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-unresolved-starter-bins").click();

  const countBadge = page.getByTestId("layout-unresolved-count");
  await expect(countBadge).toBeVisible();
  await expect(countBadge).toHaveText("1 unresolved");
});

test("changing a constraint's mode refreshes the validity badge", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-partial-starter-bins").click();

  const badge = page.getByTestId("layout-validity-badge");
  await expect(badge).toHaveText("partial");

  // The partial space's shortfall comes entirely from the first starter
  // bin's soft-min requirement; turning it off drops that requirement.
  await page
    .getByTestId("constraint-mode-gridfinity-1x1x2")
    .selectOption("off");

  await expect(badge).toHaveText("valid");
});

test("sketch state persists across a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-starter-bins").click();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  // Zustand's persist middleware writes to IndexedDB asynchronously; wait
  // for the write to land before reloading so hydration has something to read.
  await expect
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

  await page.reload();

  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");
  await expect(page.locator("canvas")).toBeVisible();
});

test("exports and re-imports a sketch to restore the layout", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByTestId("system-select").selectOption("gridfinity");
  await page.getByTestId("add-starter-bins").click();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-sketch").click(),
  ]);
  expect(download.suggestedFilename()).toBe("storagemaxxing-sketch.json");
  const exportedPath = await download.path();
  expect(exportedPath).toBeTruthy();

  // Fresh browser context so there's no persisted IndexedDB state to
  // interfere — the layout below must come from the imported file.
  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.goto("/");

  await freshPage
    .getByTestId("import-sketch-input")
    .setInputFiles(exportedPath!);

  await expect(freshPage.getByTestId("layout-validity-badge")).toHaveText(
    "valid",
  );
  await expect(freshPage.locator("canvas")).toBeVisible();

  await freshContext.close();
});
