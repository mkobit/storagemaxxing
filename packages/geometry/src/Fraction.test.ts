import { expect, test, describe } from "bun:test";
import { parseFraction, formatFraction } from "./Fraction.js";

describe("parseFraction", () => {
  test("integers", () => {
    expect(parseFraction("24")).toBe(24);
    expect(parseFraction("0")).toBe(0);
  });

  test("decimals", () => {
    expect(parseFraction("15.75")).toBe(15.75);
    expect(parseFraction("0.5")).toBe(0.5);
    expect(parseFraction("-1.5")).toBe(-1.5);
  });

  test("pure fractions", () => {
    expect(parseFraction("1/8")).toBe(0.125);
    expect(parseFraction("1/4")).toBe(0.25);
    expect(parseFraction("3/8")).toBe(0.375);
    expect(parseFraction("1/2")).toBe(0.5);
    expect(parseFraction("5/8")).toBe(0.625);
    expect(parseFraction("3/4")).toBe(0.75);
    expect(parseFraction("7/8")).toBe(0.875);
    expect(parseFraction("7/16")).toBe(0.4375);
  });

  test("mixed numbers with space", () => {
    expect(parseFraction("15 3/4")).toBe(15.75);
    expect(parseFraction("16 1/8")).toBe(16.125);
    expect(parseFraction("-1 1/2")).toBe(-1.5);
  });

  test("mixed numbers with hyphen", () => {
    expect(parseFraction("16-1/8")).toBe(16.125);
  });

  test("invalid inputs", () => {
    expect(parseFraction("")).toBeNull();
    expect(parseFraction("abc")).toBeNull();
    expect(parseFraction("15 3/0")).toBeNull();
  });
});

describe("formatFraction", () => {
  test("integers", () => {
    expect(formatFraction(16.0)).toBe("16");
    expect(formatFraction(0)).toBe("0");
    expect(formatFraction(-5)).toBe("-5");
  });

  test("pure fractions", () => {
    expect(formatFraction(0.125)).toBe("⅛");
    expect(formatFraction(0.75)).toBe("¾");
    expect(formatFraction(0.4375)).toBe("7/16");
    expect(formatFraction(-0.5)).toBe("-½");
  });

  test("mixed fractions", () => {
    expect(formatFraction(15.75)).toBe("15 ¾");
    expect(formatFraction(16.125)).toBe("16 ⅛");
    expect(formatFraction(24.5)).toBe("24 ½");
    expect(formatFraction(-1.5)).toBe("-1 ½");
    expect(formatFraction(-15.75)).toBe("-15 ¾");
  });

  test("non-standard decimals fallback", () => {
    expect(formatFraction(15.1)).toBe("15.1");
  });
});
