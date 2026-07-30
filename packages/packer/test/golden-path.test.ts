import { describe, expect, test } from "bun:test";
import { packSpace } from "../src/packer";
import { getEffectiveFootprint } from "../src/geometryUtils";
import { createPackInput, type PackInput } from "../src/PackInput";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { GOLDEN_PATH_STARTER_BIN_IDS } from "@storagemaxxing/catalog/goldenPath";

const EPSILON = 1e-3;

const starterBins: readonly PackInput[] = GOLDEN_PATH_STARTER_BIN_IDS.map(
  (id) => {
    const bin = findBinById(ALL_BINS, id)!;
    return createPackInput({
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

  test("empty constraints array returns a valid empty result", () => {
    const space = createSpaceTemplate(
      "golden-path-space",
      createDimensions3D(12, 12, 2),
      "top",
    );

    const result = packSpace(space, [], []);

    expect(result.validity).toBe("valid");
    expect(result.placedBins.length).toBe(0);
    expect(result.metrics.failures.length).toBe(0);
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
      if (failure.reason !== "heightOverflow") {
        expect(failure.placed).toBeLessThan(failure.required);
      }
    });
  });

  test("a bin whose footprint cannot fit in the space at all is excluded, never placed with a non-finite origin", () => {
    const space = createSpaceTemplate(
      "golden-path-tiny-space",
      createDimensions3D(2, 2, 2),
      "top",
    );

    const result = packSpace(space, starterBins, exactlyOneEach);

    result.placedBins.forEach((placed) => {
      expect(Number.isFinite(placed.origin[0])).toBe(true);
      expect(Number.isFinite(placed.origin[1])).toBe(true);
      expect(Number.isFinite(placed.origin[2])).toBe(true);
    });

    const oversized = starterBins.find((bin) => {
      const footprint = getEffectiveFootprint(bin);
      return footprint.w > 2 || footprint.l > 2;
    })!;
    expect(result.placedBins.some((p) => p.binId === oversized.id)).toBe(false);
  });

  test("a bin taller than the space is excluded and reported as a heightOverflow failure", () => {
    const space = createSpaceTemplate(
      "golden-path-space",
      createDimensions3D(12, 12, 2),
      "top",
    );
    const tooTall = createPackInput({ id: "too-tall-bin", w: 2, l: 2, h: 3 });
    const constraint = createSpaceConstraint(tooTall.id, 1, 0, 1);

    const result = packSpace(space, [tooTall], [constraint]);

    expect(result.validity).toBe("invalid");
    expect(result.placedBins.length).toBe(0);
    expect(result.metrics.failures).toEqual([
      {
        binId: "too-tall-bin",
        reason: "heightOverflow",
        binHeight: 3,
        spaceHeight: 2,
      },
    ]);
  });
});
