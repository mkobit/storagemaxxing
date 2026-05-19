import { expect, test, describe } from "bun:test";
import { mm, mmToIn, inToMm, inches } from "./testing.js";

describe("metric conversion", () => {
  describe("mm()", () => {
    test("accepts non-negative numbers", () => {
      expect(mm(0)).toBeMm(0);
      expect(mm(10)).toBeMm(10);
      expect(mm(25.4)).toBeMm(25.4);
    });

    test("accepts negative numbers", () => {
      expect(mm(-1)).toBeMm(-1);
      expect(mm(-25.4)).toBeMm(-25.4);
    });
  });

  describe("mmToIn()", () => {
    test("converts millimeters to inches correctly", () => {
      expect(mmToIn(mm(25.4))).toBeIn(1);
      expect(mmToIn(mm(0))).toBeIn(0);
      expect(mmToIn(mm(50.8))).toBeIn(2);
      expect(mmToIn(mm(12.7))).toBeIn(0.5);
    });

    test("converts negative millimeters to negative inches", () => {
      expect(mmToIn(mm(-25.4))).toBeIn(-1);
      expect(mmToIn(mm(-12.7))).toBeIn(-0.5);
    });
  });

  describe("inToMm()", () => {
    test("converts inches to millimeters correctly", () => {
      expect(inToMm(inches(1))).toBeMm(25.4);
      expect(inToMm(inches(0))).toBeMm(0);
      expect(inToMm(inches(2))).toBeMm(50.8);
      expect(inToMm(inches(0.5))).toBeMm(12.7);
    });

    test("converts negative inches to negative millimeters", () => {
      expect(inToMm(inches(-1))).toBeMm(-25.4);
      expect(inToMm(inches(-0.5))).toBeMm(-12.7);
    });
  });
});
