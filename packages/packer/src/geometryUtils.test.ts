import { describe, it, expect } from "bun:test";
import { isFootprintEligible, isHeightEligible } from "./geometryUtils";
import { createPackInput, createPackInputBasic } from "./PackInput";

describe("isHeightEligible", () => {
  it("is eligible when the space height is undefined", () => {
    const bin = createPackInputBasic("bin1", 4, 4, 100);
    expect(isHeightEligible(bin, undefined)).toBe(true);
  });

  it("is eligible when effective height equals the space height exactly", () => {
    const bin = createPackInputBasic("bin1", 4, 4, 2);
    expect(isHeightEligible(bin, 2)).toBe(true);
  });

  it("is eligible when effective height is less than the space height", () => {
    const bin = createPackInputBasic("bin1", 4, 4, 1);
    expect(isHeightEligible(bin, 2)).toBe(true);
  });

  it("is not eligible when effective height exceeds the space height", () => {
    const bin = createPackInputBasic("bin1", 4, 4, 3);
    expect(isHeightEligible(bin, 2)).toBe(false);
  });

  it("includes toleranceH in the effective height used for the comparison", () => {
    const bin = createPackInput({
      id: "bin1",
      w: 4,
      l: 4,
      h: 1.9,
      toleranceH: 0.2,
    });
    expect(isHeightEligible(bin, 2)).toBe(false);
  });
});

describe("isFootprintEligible", () => {
  it("is eligible when the effective footprint fits exactly within the space", () => {
    const bin = createPackInputBasic("bin1", 2, 2, 1);
    expect(isFootprintEligible(bin, { w: 2, l: 2 })).toBe(true);
  });

  it("is eligible when the effective footprint is smaller than the space", () => {
    const bin = createPackInputBasic("bin1", 1, 1, 1);
    expect(isFootprintEligible(bin, { w: 2, l: 2 })).toBe(true);
  });

  it("is not eligible when the effective width exceeds the space width", () => {
    const bin = createPackInputBasic("bin1", 3, 1, 1);
    expect(isFootprintEligible(bin, { w: 2, l: 2 })).toBe(false);
  });

  it("is not eligible when the effective length exceeds the space length", () => {
    const bin = createPackInputBasic("bin1", 1, 3, 1);
    expect(isFootprintEligible(bin, { w: 2, l: 2 })).toBe(false);
  });

  it("includes toleranceW/toleranceL in the effective footprint used for the comparison", () => {
    const bin = createPackInput({
      id: "bin1",
      w: 1.9,
      l: 1,
      h: 1,
      toleranceW: 0.2,
    });
    expect(isFootprintEligible(bin, { w: 2, l: 2 })).toBe(false);
  });
});
