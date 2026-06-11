import { describe, expect, test } from "bun:test";
import { packSpace } from "../src/packer";
import { getEffectiveFootprint } from "../src/geometryUtils";
import { createBinSpec, BinSpec } from "@storagemaxxing/assembly/BinSpec";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { GOLDEN_PATH_STARTER_BIN_IDS } from "@storagemaxxing/catalog/goldenPath";

const EPSILON = 1e-3;

const starterBins: readonly BinSpec[] = GOLDEN_PATH_STARTER_BIN_IDS.map(
  (id) => {
    const bin = findBinById(ALL_BINS, id)!;
    return createBinSpec({
      id: bin.id,
      w: bin.actual.w,
      l: bin.actual.l,
      h: bin.actual.h,
      toleranceW: bin.tolerance.w,
      toleranceL: bin.tolerance.l,
      toleranceH: bin.tolerance.h,
    });
  },
);

const exactlyOneEach = starterBins.map((bin) =>
  createSpaceConstraint(bin.id, 1, 0, 1),
);

type Rect = {
  readonly x: number;
  readonly z: number;
  readonly w: number;
  readonly l: number;
};

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x + EPSILON < b.x + b.w &&
  b.x + EPSILON < a.x + a.w &&
  a.z + EPSILON < b.z + b.l &&
  b.z + EPSILON < a.z + a.l;

describe("storage-layout: Golden-Path Packing", () => {
  test("packs starter bins into a bounded space without overlap", () => {
    const space = createSpaceTemplate(
      "golden-path-space",
      createDimensions3D(12, 12, 2),
      "top",
    );

    const result = packSpace(space, starterBins, exactlyOneEach);

    expect(result.validity).toBe("valid");
    expect(result.placedBins.length).toBe(starterBins.length);
    starterBins.forEach((bin) => {
      expect(result.metrics.placedCounts[bin.id]).toBe(1);
    });

    const rects: readonly Rect[] = result.placedBins.map((placed) => {
      const spec = starterBins.find((b) => b.id === placed.binId)!;
      const footprint = getEffectiveFootprint(spec);
      return {
        x: placed.origin[0],
        z: placed.origin[2],
        w: footprint.w,
        l: footprint.l,
      };
    });

    rects.forEach((rect) => {
      expect(rect.x).toBeGreaterThanOrEqual(-EPSILON);
      expect(rect.z).toBeGreaterThanOrEqual(-EPSILON);
      expect(rect.x + rect.w).toBeLessThanOrEqual(12 + EPSILON);
      expect(rect.z + rect.l).toBeLessThanOrEqual(12 + EPSILON);
    });

    rects.forEach((a, i) => {
      rects.slice(i + 1).forEach((b) => {
        expect(overlaps(a, b)).toBe(false);
      });
    });
  });

  test("overflow is reported, not silently dropped", () => {
    const space = createSpaceTemplate(
      "golden-path-tiny-space",
      createDimensions3D(2, 2, 2),
      "top",
    );

    const result = packSpace(space, starterBins, exactlyOneEach);

    expect(result.validity).toBe("invalid");
    expect(result.metrics.failures.length).toBeGreaterThan(0);

    const failedIds = new Set(result.metrics.failures.map((f) => f.binId));
    starterBins.forEach((bin) => {
      const placed = result.metrics.placedCounts[bin.id] ?? 0;
      if (placed < 1) {
        expect(failedIds.has(bin.id)).toBe(true);
      }
    });
    result.metrics.failures.forEach((failure) => {
      expect(failure.placed).toBeLessThan(failure.required);
    });
  });
});
