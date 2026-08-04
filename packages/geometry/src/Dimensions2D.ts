import { z } from "zod";

/**
 * Zod schema for Dimensions2D.
 */
export const Dimensions2DSchema = z
  .object({
    w: z.number(),
    l: z.number(),
  })
  .readonly();

export type Dimensions2D<T extends number = number> = {
  readonly w: T;
  readonly l: T;
};

export const createDimensions2D = <T extends number>(
  w: T,
  l: T,
): Dimensions2D<T> => ({
  w,
  l,
});
