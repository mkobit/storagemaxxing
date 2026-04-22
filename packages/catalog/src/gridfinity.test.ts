import { expect, test } from "bun:test";
import { GRIDFINITY_CATALOG } from "./gridfinity.js";

test("GRIDFINITY_CATALOG generates correct number of bins", () => {
  expect(GRIDFINITY_CATALOG.length).toBe(36);
});

test("Gridfinity 2x2x1 bin has the correct dimensions", () => {
  const bin2x2x1 = GRIDFINITY_CATALOG.find((b) => b.id === "gridfinity-2x2x1");
  expect(bin2x2x1).toBeDefined();

  if (bin2x2x1) {
    // Nominal: W=84mm, D=84mm, H=7mm
    expect(bin2x2x1.nominal.w).toBeCloseTo(84 / 25.4, 4);
    expect(bin2x2x1.nominal.l).toBeCloseTo(84 / 25.4, 4);
    expect(bin2x2x1.nominal.h).toBeCloseTo(7 / 25.4, 4);

    // Actual: W=83.5mm, D=83.5mm, H=7mm
    expect(bin2x2x1.actual.w).toBeCloseTo(83.5 / 25.4, 4);
    expect(bin2x2x1.actual.l).toBeCloseTo(83.5 / 25.4, 4);
    expect(bin2x2x1.actual.h).toBeCloseTo(7 / 25.4, 4);

    // Tolerance: W=0.5mm, D=0.5mm, H=0mm
    expect(bin2x2x1.tolerance.w).toBeCloseTo(0.5 / 25.4, 4);
    expect(bin2x2x1.tolerance.l).toBeCloseTo(0.5 / 25.4, 4);
    expect(bin2x2x1.tolerance.h).toBeCloseTo(0, 4);
  }
});

test("Gridfinity 1x1x4 bin has the correct dimensions", () => {
  const bin1x1x4 = GRIDFINITY_CATALOG.find((b) => b.id === "gridfinity-1x1x4");
  expect(bin1x1x4).toBeDefined();

  if (bin1x1x4) {
    // Nominal: W=42mm, D=42mm, H=28mm
    expect(bin1x1x4.nominal.w).toBeCloseTo(42 / 25.4, 4);
    expect(bin1x1x4.nominal.l).toBeCloseTo(42 / 25.4, 4);
    expect(bin1x1x4.nominal.h).toBeCloseTo(28 / 25.4, 4);

    // Actual: W=41.5mm, D=41.5mm, H=28mm
    expect(bin1x1x4.actual.w).toBeCloseTo(41.5 / 25.4, 4);
    expect(bin1x1x4.actual.l).toBeCloseTo(41.5 / 25.4, 4);
    expect(bin1x1x4.actual.h).toBeCloseTo(28 / 25.4, 4);

    // Tolerance: W=0.5mm, D=0.5mm, H=0mm
    expect(bin1x1x4.tolerance.w).toBeCloseTo(0.5 / 25.4, 4);
    expect(bin1x1x4.tolerance.l).toBeCloseTo(0.5 / 25.4, 4);
    expect(bin1x1x4.tolerance.h).toBeCloseTo(0, 4);
  }
});
