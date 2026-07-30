import { test, expect, type Page } from "@playwright/test";

// Space bounds are drawn as a dashed rect using the --color-canvas-grid token
// (LayoutCanvas.tsx). Since layout-fit-to-viewport, the rect's pixel size is a
// dynamic fit (not a fixed PIXELS_PER_INCH density), but the fit is uniform on
// both axes, so the rect's aspect ratio must still match the space's w:l ratio.
const GRID_STROKE_COLOR = "#666666";

const createSpace = async (
  page: Page,
  options: { name: string; columns: number; rows: number; depth: number },
) => {
  await page.getByTestId("create-space-name").fill(options.name);
  await page.getByTestId("create-space-columns").fill(String(options.columns));
  await page.getByTestId("create-space-rows").fill(String(options.rows));
  await page.getByTestId("create-space-depth").fill(String(options.depth));
  await page.getByTestId("create-space-submit").click();
};

const canvasStrokeBoundsPx = (page: Page) =>
  page.evaluate((color) => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < data.length; i += 4) {
      const hex = `#${toHex(data[i])}${toHex(data[i + 1])}${toHex(data[i + 2])}`;
      if (hex !== color) continue;
      const px = (i / 4) % canvas.width;
      const py = Math.floor(i / 4 / canvas.width);
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    if (maxX < 0) return null;
    return { width: maxX - minX, height: maxY - minY };
  }, GRID_STROKE_COLOR);

const canvasStrokeAspectRatio = async (page: Page) => {
  const bounds = await canvasStrokeBoundsPx(page);
  return bounds ? bounds.width / bounds.height : null;
};

test("entering custom dimensions and clicking Create Space renders a 5x4 grid on the canvas", async ({
  page,
}) => {
  await page.goto("/");

  await createSpace(page, { name: "My drawer", columns: 5, rows: 4, depth: 2 });

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByTestId("layout-validity-badge")).toHaveText("valid");

  await expect
    .poll(() => canvasStrokeAspectRatio(page), { timeout: 10_000 })
    .toBeCloseTo(5 / 4, 1);
});

test("creating a second space and switching to it updates the canvas to that space's own resolution", async ({
  page,
}) => {
  await page.goto("/");

  await createSpace(page, {
    name: "First drawer",
    columns: 3,
    rows: 3,
    depth: 2,
  });
  await expect
    .poll(() => canvasStrokeAspectRatio(page), { timeout: 10_000 })
    .toBeCloseTo(1, 1);

  await createSpace(page, {
    name: "Second drawer",
    columns: 6,
    rows: 2,
    depth: 2,
  });
  await expect
    .poll(() => canvasStrokeAspectRatio(page), { timeout: 10_000 })
    .toBeCloseTo(6 / 2, 1);

  await page
    .getByTestId("space-manager")
    .getByRole("button", { name: "First drawer" })
    .click();

  await expect
    .poll(() => canvasStrokeAspectRatio(page), { timeout: 10_000 })
    .toBeCloseTo(1, 1);
});
