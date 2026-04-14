import { expect, test, describe } from "bun:test";
import { parseDim, formatDim } from "./dimensions";
import { Inches } from "./types";

describe("parseDim", () => {
  test("integers", () => {
    expect(parseDim("24")).toBe(24 as Inches);
    expect(parseDim("0")).toBe(0 as Inches);
  });

  test("decimals", () => {
    expect(parseDim("15.75")).toBe(15.75 as Inches);
    expect(parseDim("0.5")).toBe(0.5 as Inches);
  });

  test("pure fractions", () => {
    expect(parseDim("1/8")).toBe(0.125 as Inches);
    expect(parseDim("1/4")).toBe(0.25 as Inches);
    expect(parseDim("3/8")).toBe(0.375 as Inches);
    expect(parseDim("1/2")).toBe(0.5 as Inches);
    expect(parseDim("5/8")).toBe(0.625 as Inches);
    expect(parseDim("3/4")).toBe(0.75 as Inches);
    expect(parseDim("7/8")).toBe(0.875 as Inches);
  });

  test("mixed numbers with space", () => {
    expect(parseDim("15 3/4")).toBe(15.75 as Inches);
    expect(parseDim("16 1/8")).toBe(16.125 as Inches);
  });

  test("mixed numbers with hyphen", () => {
    expect(parseDim("16-1/8")).toBe(16.125 as Inches);
  });

  test("invalid inputs", () => {
    expect(parseDim("")).toBeNull();
    expect(parseDim("abc")).toBeNull();
    expect(parseDim("15 3/9")).toBeNull(); // unsupported fraction
  });
});

describe("formatDim", () => {
  test("integers", () => {
    expect(formatDim(16.0 as Inches)).toBe("16″");
    expect(formatDim(0 as Inches)).toBe("0″");
  });

  test("pure fractions", () => {
    expect(formatDim(0.125 as Inches)).toBe("⅛″");
    expect(formatDim(0.75 as Inches)).toBe("¾″");
  });

  test("mixed fractions", () => {
    expect(formatDim(15.75 as Inches)).toBe("15 ¾″");
    expect(formatDim(16.125 as Inches)).toBe("16 ⅛″");
    expect(formatDim(24.5 as Inches)).toBe("24 ½″");
  });

  test("non-standard decimals fallback", () => {
    expect(formatDim(15.1 as Inches)).toBe("15.1″");
  });
});
