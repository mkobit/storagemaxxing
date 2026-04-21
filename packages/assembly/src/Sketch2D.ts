import { z } from "zod";
import { SketchElement, SketchElementSchema } from "./SketchElement.js";
import { SketchId, SketchIdSchema } from "./SketchId.js";

export const Sketch2DSchema = z
  .object({
    id: SketchIdSchema,
    name: z.string(),
    elements: z.array(SketchElementSchema).readonly(),
  })
  .readonly();

export type Sketch2D = z.infer<typeof Sketch2DSchema>;

export const createSketch2D = (
  id: SketchId,
  name: string,
  elements: readonly SketchElement[],
): Sketch2D => ({
  id,
  name,
  elements,
});
