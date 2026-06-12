import { expect } from "bun:test";
import { mm, type Millimeters } from "./Millimeters";
import { inches, type Inches } from "./Inches";
import { createSize, type Size } from "./Dimensions2D";

export { mm, mmToIn, inToMm, createMillimeters } from "./Millimeters";
export { inches, parseDim, formatDim, createInches } from "./Inches";
export { createSize, createDimensions2D } from "./Dimensions2D";

export type { Millimeters, Inches, Size };

/**
 * Test factory for Millimeters.
 */
export const mms = (
  ...values: ReadonlyArray<number>
): ReadonlyArray<Millimeters> => values.map(mm);

/**
 * Test factory for Inches.
 */
export const ins = (
  ...values: ReadonlyArray<number>
): ReadonlyArray<Inches> => values.map(inches);

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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
