import { describe, it, expect } from "bun:test";
import { MaxRectsPacker } from "maxrects-packer";
import {
  getPlacedCounts,
  checkPhaseFailures,
  getHardMin,
  HeightEligibility,
} from "./packerUtils";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";

const NO_HEIGHT_INELIGIBLE: HeightEligibility = {
  ineligibleHeights: new Map(),
  spaceHeight: 0,
};

const HARD_MIN_PHASE = { getRequired: getHardMin, reason: "hardMin" as const };

describe("packerUtils", () => {
  describe("getPlacedCounts", () => {
    it("should return empty map for no rects", () => {
      const packer = new MaxRectsPacker(100, 100, 0);
      const counts = getPlacedCounts(packer);
      expect(counts.size).toBe(0);
    });

    it("should count rects by binId", () => {
      const rects = [
        { x: 0, y: 0, width: 10, height: 10, data: { binId: "bin1" } },
        { x: 10, y: 0, width: 10, height: 10, data: { binId: "bin1" } },
        { x: 0, y: 10, width: 10, height: 10, data: { binId: "bin2" } },
      ];
      const packer = {
        bins: [{ rects }],
      } as unknown as MaxRectsPacker;

      const counts = getPlacedCounts(packer);
      expect(counts.get("bin1")).toBe(2);
      expect(counts.get("bin2")).toBe(1);
      expect(counts.get("bin3")).toBe(undefined);
    });
  });

  describe("checkPhaseFailures", () => {
    it("should return failures when placed < req", () => {
      const constraints: readonly SpaceConstraint[] = [
        { binId: "bin1", mode: "hard", lo: 5 } as unknown as SpaceConstraint,
      ];
      const placedCounts = new Map([["bin1", 3]]);

      const failures = checkPhaseFailures(
        constraints,
        placedCounts,
        HARD_MIN_PHASE,
        NO_HEIGHT_INELIGIBLE,
      );
      expect(failures.length).toBe(1);
      const failure = failures[0];
      if (failure.reason === "hardMin" || failure.reason === "softMin") {
        expect(failure.binId).toBe("bin1");
        expect(failure.placed).toBe(3);
        expect(failure.required).toBe(5);
      }
    });

    it("should return no failures when placed >= req", () => {
      const constraints: readonly SpaceConstraint[] = [
        { binId: "bin1", mode: "hard", lo: 5 } as unknown as SpaceConstraint,
      ];
      const placedCounts = new Map([["bin1", 5]]);

      const failures = checkPhaseFailures(
        constraints,
        placedCounts,
        HARD_MIN_PHASE,
        NO_HEIGHT_INELIGIBLE,
      );
      expect(failures.length).toBe(0);
    });

    it("should return a heightOverflow failure instead of a count-based failure for a height-ineligible bin with positive demand", () => {
      const constraints: readonly SpaceConstraint[] = [
        { binId: "bin1", mode: "hard", lo: 5 } as unknown as SpaceConstraint,
      ];
      const placedCounts = new Map<string, number>();
      const heightEligibility: HeightEligibility = {
        ineligibleHeights: new Map([["bin1", 3]]),
        spaceHeight: 2,
      };

      const failures = checkPhaseFailures(
        constraints,
        placedCounts,
        HARD_MIN_PHASE,
        heightEligibility,
      );
      expect(failures.length).toBe(1);
      expect(failures[0]).toEqual({
        binId: "bin1",
        reason: "heightOverflow",
        binHeight: 3,
        spaceHeight: 2,
      });
    });

    it("does not fail a height-ineligible bin with no positive demand", () => {
      const constraints: readonly SpaceConstraint[] = [
        { binId: "bin1", mode: "auto", lo: 0 } as unknown as SpaceConstraint,
      ];
      const placedCounts = new Map<string, number>();
      const heightEligibility: HeightEligibility = {
        ineligibleHeights: new Map([["bin1", 3]]),
        spaceHeight: 2,
      };

      const failures = checkPhaseFailures(
        constraints,
        placedCounts,
        HARD_MIN_PHASE,
        heightEligibility,
      );
      expect(failures.length).toBe(0);
    });
  });
});
