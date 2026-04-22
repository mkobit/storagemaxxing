import { z } from "zod";
import { Rect2D } from "@storagemaxxing/geometry/Rect2D.js";
import { Line2D } from "@storagemaxxing/geometry/Line2D.js";
import { SketchElementId, SketchElementIdSchema } from "./SketchElementId.js";

// Note: Assuming geometry Zod schemas exist or we do custom validation.
// For now, we will use z.any() for geometry to avoid overcomplicating unless needed,
// but ideally we'd define Zod schemas for Rect2D and Line2D.
export const Rect2DSchema = z.any(); // Replace with actual schema later if needed
export const Line2DSchema = z.any(); // Replace with actual schema later if needed

export const SketchRectangleSchema = z
  .object({
    id: SketchElementIdSchema,
    type: z.literal("rectangle"),
    geometry: z.custom<Rect2D>(),
  })
  .readonly();

export type SketchRectangle = z.infer<typeof SketchRectangleSchema>;

export const SketchLineSchema = z
  .object({
    id: SketchElementIdSchema,
    type: z.literal("line"),
    geometry: z.custom<Line2D>(),
  })
  .readonly();

export type SketchLine = z.infer<typeof SketchLineSchema>;

export const SketchElementSchema = z.discriminatedUnion("type", [
  SketchRectangleSchema,
  SketchLineSchema,
]);

export type SketchElement = z.infer<typeof SketchElementSchema>;

export const createSketchRectangle = (
  id: SketchElementId,
  geometry: Rect2D,
): SketchRectangle => ({
  id,
  type: "rectangle",
  geometry,
});

export const createSketchLine = (
  id: SketchElementId,
  geometry: Line2D,
): SketchLine => ({
  id,
  type: "line",
  geometry,
});
