import { expect } from "bun:test";

export { mm, mmToIn, inToMm } from "./Millimeters";
export { inches } from "./Inches";

/**
 * Custom matchers for branded types.
 */
interface BrandedMatchers {
  toBeMm(expected: number): void;
  toBeInches(expected: number): void;
}

declare module "bun:test" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars -- module augmentation: T must match bun:test's own Matchers<T> signature for declaration merging to apply, even though this augmentation's extends-only body doesn't use it
  interface Matchers<T = unknown> extends BrandedMatchers {}
}

expect.extend({
  toBeMm(actual: unknown, expected: number) {
    const pass = actual === expected;
    return {
      message: () =>
        pass
          ? `expected ${actual} not to be ${expected}mm`
          : `expected ${actual} to be ${expected}mm`,
      pass,
    };
  },
  toBeInches(actual: unknown, expected: number) {
    const pass = actual === expected;
    return {
      message: () =>
        pass
          ? `expected ${actual} not to be ${expected}″`
          : `expected ${actual} to be ${expected}″`,
      pass,
    };
  },
});
