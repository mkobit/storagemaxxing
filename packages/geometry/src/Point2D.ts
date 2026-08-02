import { vec2, ReadonlyVec2 } from "gl-matrix";
import { z } from "zod";

/**
 * Zod schema for Point2D.
 * Supports both [x, y] tuples (standard for JSON) and Float32Array (gl-matrix).
 */
export const Point2DSchema = z
  .union([
    z.tuple([z.number(), z.number()]),
    z.instanceof(Float32Array).refine((arr) => arr.length === 2, {
      message: "Point2D must have exactly 2 components",
    }),
  ])
  .transform((val): ReadonlyVec2 => {
    if (val instanceof Float32Array) {
      return val;
    }
    return vec2.fromValues(val[0], val[1]);
  });

export type Point2D = ReadonlyVec2;

/**
 * Alias for Point2D to match OpenSpec terminology
 */
export type Point = Point2D;

export const createPoint2D = (x: number, y: number): Point2D =>
  vec2.fromValues(x, y);
