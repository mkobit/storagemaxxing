import { expect, test, describe } from "bun:test";
import { parseDim, formatDim } from "./Inches";
import { inches } from "./testing";

describe("parseDim", () => {
  test("integers", () => {
    expect(parseDim("24")).toBeInches(24);
    expect(parseDim("0")).toBeInches(0);
  });

  test("decimals", () => {
    expect(parseDim("15.75")).toBeInches(15.75);
    expect(parseDim("0.5")).toBeInches(0.5);
    expect(parseDim("-1.5")).toBeInches(-1.5);
  });

  test("pure fractions", () => {
    expect(parseDim("1/8")).toBeInches(0.125);
    expect(parseDim("1/4")).toBeInches(0.25);
    expect(parseDim("3/8")).toBeInches(0.375);
    expect(parseDim("1/2")).toBeInches(0.5);
    expect(parseDim("5/8")).toBeInches(0.625);
    expect(parseDim("3/4")).toBeInches(0.75);
    expect(parseDim("7/8")).toBeInches(0.875);
    expect(parseDim("7/16")).toBeInches(0.4375);
  });

  test("mixed numbers with space", () => {
    expect(parseDim("15 3/4")).toBeInches(15.75);
    expect(parseDim("16 1/8")).toBeInches(16.125);
    expect(parseDim("-1 1/2")).toBeInches(-1.5);
  });

  test("mixed numbers with hyphen", () => {
    expect(parseDim("16-1/8")).toBeInches(16.125);
  });

  test("invalid inputs", () => {
    expect(parseDim("")).toBeNull();
    expect(parseDim("abc")).toBeNull();
    expect(parseDim("15 3/0")).toBeNull();
  });
});

describe("formatDim", () => {
  test("integers", () => {
    expect(formatDim(inches(16.0))).toBe("16″");
    expect(formatDim(inches(0))).toBe("0″");
    expect(formatDim(inches(-5))).toBe("-5″");
  });

  test("pure fractions", () => {
    expect(formatDim(inches(0.125))).toBe("⅛″");
    expect(formatDim(inches(0.75))).toBe("¾″");
    expect(formatDim(inches(0.4375))).toBe("7/16″");
    expect(formatDim(inches(-0.5))).toBe("-½″");
  });

  test("mixed fractions", () => {
    expect(formatDim(inches(15.75))).toBe("15 ¾″");
    expect(formatDim(inches(16.125))).toBe("16 ⅛″");
    expect(formatDim(inches(24.5))).toBe("24 ½″");
    expect(formatDim(inches(-1.5))).toBe("-1 ½″");
    expect(formatDim(inches(-15.75))).toBe("-15 ¾″");
  });

  test("non-standard decimals fallback", () => {
    expect(formatDim(inches(15.1))).toBe("15.1″");
  });
});
