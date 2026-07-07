import { describe, it, expect } from "bun:test";
import { isHeightEligible } from "./geometryUtils";
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
