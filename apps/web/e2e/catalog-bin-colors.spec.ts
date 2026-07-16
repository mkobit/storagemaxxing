import { test, expect } from "@playwright/test";

// sm-xx51: createSpaceConstraint() hardcoded color: "#000000", and the real
// "Add Bins" catalog flow in ConstraintEditorPanel never overrode it, so
// every catalog-added bin fused into one solid black shape on the layout
// canvas. The fix (binColorForIndex, apps/web/src/ui/binColorPalette.ts)
// assigns rotating palette colors by add order -- but PR #228's regression
// test only asserts constraint.color at the RTL/unit level, not the actual
// canvas pixels a jsdom/happy-dom environment can't render. This drives the
// real Add Bins catalog flow (not golden-path.spec.ts's demo-shortcut
// fixture, which sm-16x6 found hid this bug from every existing e2e spec)
// and pixel-scans the canvas the same way golden-path.spec.ts does.
const BIN_COLOR_PALETTE = ["#4e79a7", "#f28e2b"];
const VIEWPORT_MARGIN_PX = 20;

test("catalog-added bins render distinct palette colors, not solid black", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("create-space-name").fill("Palette check");
  await page.getByTestId("create-space-system").selectOption("gridfinity");
  await page.getByTestId("create-space-columns").fill("14");
  await page.getByTestId("create-space-rows").fill("10");
  await page.getByTestId("create-space-depth").fill("2");
  await page.getByTestId("create-space-submit").click();

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
          { colors: BIN_COLOR_PALETTE, marginPx: VIEWPORT_MARGIN_PX },
        ),
      { timeout: 10_000 },
    )
    .toEqual([...BIN_COLOR_PALETTE].sort());
});
