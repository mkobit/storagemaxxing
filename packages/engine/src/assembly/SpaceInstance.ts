import { z } from "zod";
import { SpaceTemplateIdSchema } from "./SpaceTemplate.js";
import { SpaceConstraintSchema } from "./SpaceConstraint.js";
import {
  PlacedBinSchema,
  PackingStrategyIdSchema,
  BinSpecIdSchema,
} from "./BaseTypes.js";

export const SpaceInstanceIdSchema = z.string().brand<"SpaceInstanceId">();
export type SpaceInstanceId = z.infer<typeof SpaceInstanceIdSchema>;

export const SpaceInstanceSchema = z
  .object({
    id: SpaceInstanceIdSchema,
    templateId: SpaceTemplateIdSchema,
    name: z.string(),
    count: z.number().int().positive(),
    constraints: z.record(BinSpecIdSchema, SpaceConstraintSchema).readonly(),
    activeStrategy: PackingStrategyIdSchema.optional(),
    placedBins: z.array(PlacedBinSchema).readonly().optional(),
  })
  .readonly();

export type SpaceInstance = z.infer<typeof SpaceInstanceSchema>;
