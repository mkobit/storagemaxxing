import { expect, test, describe } from "bun:test";
import { Point2DSchema, createPoint2D } from "./Point2D";
import { Dimensions2DSchema } from "./Dimensions2D";
import { Rect2DSchema } from "./Rect2D";

describe("Point2D", () => {
  test("validates a tuple [x, y]", () => {
    const result = Point2DSchema.parse([10, 20]);
    expect(result[0]).toBe(10);
    expect(result[1]).toBe(20);
    expect(result).toBeInstanceOf(Float32Array);
  });

  test("validates a Float32Array from gl-matrix", () => {
    const p = createPoint2D(5, 15);
    const result = Point2DSchema.parse(p);
    expect(result).toBe(p);
  });

  test("fails on invalid lengths", () => {
    expect(() => Point2DSchema.parse([1, 2, 3])).toThrow();
    expect(() => Point2DSchema.parse(new Float32Array([1]))).toThrow();
  });
});

describe("Dimensions2D", () => {
  test("validates an object {w, l}", () => {
    const d = { w: 100, l: 200 };
    const result = Dimensions2DSchema.parse(d);
    expect(result).toEqual(d);
    expect(Object.isFrozen(result)).toBe(true);
  });

  test("fails on missing fields", () => {
    expect(() => Dimensions2DSchema.parse({ w: 10 })).toThrow();
  });
});

describe("Rect2D", () => {
  test("validates a full rect", () => {
    const r = {
      origin: [10, 10],
      dimensions: { w: 50, l: 50 },
    };
    const result = Rect2DSchema.parse(r);
    expect(result.origin).toBeInstanceOf(Float32Array);
    expect(result.origin[0]).toBe(10);
    expect(result.dimensions.w).toBe(50);
  });
});
