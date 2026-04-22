import { z } from "zod";
import { SketchIdSchema } from "./SketchId.js";

export const FeatureIdSchema = z.string().brand<"FeatureId">();
export type FeatureId = z.infer<typeof FeatureIdSchema>;

export const SketchFeatureSchema = z
  .object({
    id: FeatureIdSchema,
    type: z.literal("sketch"),
    name: z.string(),
    sketchId: SketchIdSchema,
  })
  .readonly();

export type SketchFeature = z.infer<typeof SketchFeatureSchema>;

export const FillSpaceFeatureSchema = z
  .object({
    id: FeatureIdSchema,
    type: z.literal("fill_space"),
    name: z.string(),
    sketchId: SketchIdSchema, // References the profile used for the fill space
  })
  .readonly();

export type FillSpaceFeature = z.infer<typeof FillSpaceFeatureSchema>;

export const FeatureSchema = z.discriminatedUnion("type", [
  SketchFeatureSchema,
  FillSpaceFeatureSchema,
]);

export type Feature = z.infer<typeof FeatureSchema>;

export const createFeatureId = (id?: string): FeatureId => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (id || crypto.randomUUID()) as unknown as FeatureId;
};

export const createSketchFeature = (
  id: FeatureId,
  name: string,
  sketchId: z.infer<typeof SketchIdSchema>,
): SketchFeature => ({
  id,
  type: "sketch",
  name,
  sketchId,
});

export const createFillSpaceFeature = (
  id: FeatureId,
  name: string,
  sketchId: z.infer<typeof SketchIdSchema>,
): FillSpaceFeature => ({
  id,
  type: "fill_space",
  name,
  sketchId,
});
