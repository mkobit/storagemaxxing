import { expect, test, describe } from "bun:test";
import { mm, mmToIn, inToMm } from "./Millimeters.js";
import { inches } from "./Inches.js";

describe("metric conversion", () => {
  describe("mm()", () => {
    test("accepts non-negative numbers", () => {
      expect(mm(0)).toBe(0 as never);
      expect(mm(10)).toBe(10 as never);
      expect(mm(25.4)).toBe(25.4 as never);
    });

    test("accepts negative numbers", () => {
      expect(mm(-1)).toBe(-1 as never);
      expect(mm(-25.4)).toBe(-25.4 as never);
    });
  });

  describe("mmToIn()", () => {
    test("converts millimeters to inches correctly", () => {
      expect(mmToIn(mm(25.4))).toBe(inches(1));
      expect(mmToIn(mm(0))).toBe(inches(0));
      expect(mmToIn(mm(50.8))).toBe(inches(2));
      expect(mmToIn(mm(12.7))).toBe(inches(0.5));
    });

    test("converts negative millimeters to negative inches", () => {
      expect(mmToIn(mm(-25.4))).toBe(inches(-1));
      expect(mmToIn(mm(-12.7))).toBe(inches(-0.5));
    });
  });

  describe("inToMm()", () => {
    test("converts inches to millimeters correctly", () => {
      expect(inToMm(inches(1))).toBe(mm(25.4));
      expect(inToMm(inches(0))).toBe(mm(0));
      expect(inToMm(inches(2))).toBe(mm(50.8));
      expect(inToMm(inches(0.5))).toBe(mm(12.7));
    });

    test("converts negative inches to negative millimeters", () => {
      expect(inToMm(inches(-1))).toBe(mm(-25.4));
      expect(inToMm(inches(-0.5))).toBe(mm(-12.7));
    });
  });
});
