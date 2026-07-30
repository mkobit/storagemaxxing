import { Point2D, Point2DSchema } from "./Point2D";
import { Dimensions2D, Dimensions2DSchema } from "./Dimensions2D";
import { z } from "zod";

/**
 * Zod schema for Rect2D.
 */
export const Rect2DSchema = z
  .object({
    origin: Point2DSchema,
    dimensions: Dimensions2DSchema,
  })
  .readonly();

export type Rect2D<T extends number = number> = {
  readonly origin: Point2D;
  readonly dimensions: Dimensions2D<T>;
};

/**
 * Alias for Rect2D to match OpenSpec terminology
 */
export type Rect<T extends number = number> = Rect2D<T>;

export const createRect2D = <T extends number>(
  origin: Point2D,
  dimensions: Dimensions2D<T>,
): Rect2D<T> => ({
  origin,
  dimensions,
});

/**
 * Alias for createRect2D
 */
export const createRect = createRect2D;
