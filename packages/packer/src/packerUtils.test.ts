import { describe, it, expect } from "bun:test";
import { MaxRectsPacker } from "maxrects-packer";
import { getPlacedCounts, checkPhaseFailures, getHardMin } from "./packerUtils.js";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint.js";

describe("packerUtils", () => {
  describe("getPlacedCounts", () => {
    it("should return empty map for no rects", () => {
      const packer = new MaxRectsPacker(100, 100, 0);
      const counts = getPlacedCounts(packer);
      expect(counts.size).toBe(0);
    });

    it("should count rects by binId", () => {
      const packer = new MaxRectsPacker(100, 100, 0);
      const rects = [
        { x: 0, y: 0, width: 10, height: 10, data: { binId: "bin1" } },
        { x: 10, y: 0, width: 10, height: 10, data: { binId: "bin1" } },
        { x: 0, y: 10, width: 10, height: 10, data: { binId: "bin2" } },
      ];
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (packer as any).bins = [{ rects }];

      const counts = getPlacedCounts(packer);
      expect(counts.get("bin1")).toBe(2);
      expect(counts.get("bin2")).toBe(1);
      expect(counts.get("bin3")).toBe(undefined);
    });
  });

  describe("checkPhaseFailures", () => {
    it("should return failures when placed < req", () => {
      const constraints: readonly SpaceConstraint[] = [
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        { binId: "bin1", mode: "hard", lo: 5 } as SpaceConstraint,
      ];
      const placedCounts = new Map([["bin1", 3]]);

      const failures = checkPhaseFailures(constraints, placedCounts, getHardMin, "hardMin");
      expect(failures.length).toBe(1);
      expect(failures[0].binId).toBe("bin1");
      expect(failures[0].placed).toBe(3);
      expect(failures[0].required).toBe(5);
    });

    it("should return no failures when placed >= req", () => {
      const constraints: readonly SpaceConstraint[] = [
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        { binId: "bin1", mode: "hard", lo: 5 } as SpaceConstraint,
      ];
      const placedCounts = new Map([["bin1", 5]]);

      const failures = checkPhaseFailures(constraints, placedCounts, getHardMin, "hardMin");
      expect(failures.length).toBe(0);
    });
  });
});
