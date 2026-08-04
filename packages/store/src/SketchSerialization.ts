import { z } from "zod";
import {
  SpaceInstanceSchema,
  SpaceInstanceIdSchema,
} from "@storagemaxxing/assembly/SpaceInstance";
import {
  SpaceTemplateSchema,
  SpaceTemplateIdSchema,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraintSchema } from "@storagemaxxing/assembly/SpaceConstraint";
import { AppState } from "./StoreTypes";

const SketchSchema = z
  .object({
    spaces: z.array(SpaceInstanceSchema).readonly(),
    activeSpaceId: SpaceInstanceIdSchema.nullable(),
    templatesById: z
      .record(SpaceTemplateIdSchema, SpaceTemplateSchema)
      .readonly(),
    constraintsBySpace: z
      .record(SpaceTemplateIdSchema, z.array(SpaceConstraintSchema).readonly())
      .readonly(),
  })
  .readonly();

export type Sketch = z.infer<typeof SketchSchema>;

const toSketch = (
  state: Pick<
    AppState,
    "spaces" | "activeSpaceId" | "templatesById" | "constraintsBySpace"
  >,
): Sketch => ({
  spaces: state.spaces,
  activeSpaceId: state.activeSpaceId,
  templatesById: state.templatesById,
  constraintsBySpace: state.constraintsBySpace,
});

export const serializeSketch = (
  state: Pick<
    AppState,
    "spaces" | "activeSpaceId" | "templatesById" | "constraintsBySpace"
  >,
): string => JSON.stringify(toSketch(state), null, 2);

export const parseSketch = (json: string): Sketch =>
  SketchSchema.parse(JSON.parse(json));
