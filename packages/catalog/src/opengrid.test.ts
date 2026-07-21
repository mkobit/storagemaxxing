import { expect, test } from "bun:test";
import { OPENGRID_CATALOG } from "./opengrid";

test("OPENGRID_CATALOG generates correct number of bins", () => {
  expect(OPENGRID_CATALOG.length).toBe(36);
});

test("openGrid 2x2x1 bin has the correct dimensions", () => {
  const bin2x2x1 = OPENGRID_CATALOG.find((b) => b.id === "opengrid-2x2x1");
  expect(bin2x2x1).toBeDefined();

  if (bin2x2x1) {
    // Nominal: W=56mm, D=56mm, H=28mm
    expect(bin2x2x1.nominal.w).toBeCloseTo(56 / 25.4, 4);
    expect(bin2x2x1.nominal.l).toBeCloseTo(56 / 25.4, 4);
    expect(bin2x2x1.nominal.h).toBeCloseTo(28 / 25.4, 4);

    // Actual: W=53mm, D=53mm, H=28mm (3mm divider thickness subtracted from W/D only)
    expect(bin2x2x1.actual.w).toBeCloseTo(53 / 25.4, 4);
    expect(bin2x2x1.actual.l).toBeCloseTo(53 / 25.4, 4);
    expect(bin2x2x1.actual.h).toBeCloseTo(28 / 25.4, 4);

    // Tolerance: W=3mm, D=3mm, H=0mm
    expect(bin2x2x1.tolerance.w).toBeCloseTo(3 / 25.4, 4);
    expect(bin2x2x1.tolerance.l).toBeCloseTo(3 / 25.4, 4);
    expect(bin2x2x1.tolerance.h).toBeCloseTo(0, 4);
  }
});

test("openGrid 3 units and Gridfinity 2 units both span 84mm", () => {
  const bin3x1x1 = OPENGRID_CATALOG.find((b) => b.id === "opengrid-3x1x1");
  expect(bin3x1x1).toBeDefined();

  if (bin3x1x1) {
    // 3 openGrid units (3 x 28mm) == 2 Gridfinity units (2 x 42mm) == 84mm
    expect(bin3x1x1.nominal.w).toBeCloseTo(84 / 25.4, 4);
  }
});
