import { expect } from "bun:test";
import { mm, type Millimeters } from "./Millimeters.js";
import { inches, type Inches } from "./Inches.js";
import { createSize, type Size } from "./Dimensions2D.js";

export { mm, mmToIn, inToMm, createMillimeters } from "./Millimeters.js";
export { inches, parseDim, formatDim, createInches } from "./Inches.js";
export { createSize, createDimensions2D } from "./Dimensions2D.js";

export type { Millimeters, Inches, Size };

/**
 * Test factory for Millimeters.
 */
export const mms = (...values: number[]): Millimeters[] => values.map(mm);

/**
 * Test factory for Inches.
 */
export const ins = (...values: number[]): Inches[] => values.map(inches);

/**
 * Test factory for Dimensions2D in Millimeters.
 */
export const mmSize = (w: number, l: number): Size<Millimeters> =>
  createSize(mm(w), mm(l));

/**
 * Test factory for Dimensions2D in Inches.
 */
export const inSize = (w: number, l: number): Size<Inches> =>
  createSize(inches(w), inches(l));

/**
 * Custom matchers for branded types.
 */
interface BrandedMatchers {
  toBeMm(expected: number): void;
  toBeInches(expected: number): void;
}

declare module "bun:test" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<T = unknown> extends BrandedMatchers {}
}

expect.extend({
  toBeMm(actual: unknown, expected: number) {
    const pass = (actual as number) === expected;
    return {
      message: () =>
        pass
          ? `expected ${actual} not to be ${expected}mm`
          : `expected ${actual} to be ${expected}mm`,
      pass,
    };
  },
  toBeInches(actual: unknown, expected: number) {
    const pass = (actual as number) === expected;
    return {
      message: () =>
        pass
          ? `expected ${actual} not to be ${expected}″`
          : `expected ${actual} to be ${expected}″`,
      pass,
    };
  },
});
