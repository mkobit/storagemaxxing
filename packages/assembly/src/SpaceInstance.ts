import { z } from "zod";
import { SpaceTemplateIdSchema } from "./SpaceTemplate";
import { SpaceConstraintSchema } from "./SpaceConstraint";
import { PlacedBinSchema } from "./PlacedBin";
import { PackingStrategyIdSchema, BinSpecIdSchema } from "./BaseTypes";

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
