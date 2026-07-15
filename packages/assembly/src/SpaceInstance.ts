import { z } from "zod";
import { StorageSystemSchema } from "@storagemaxxing/catalog/StorageSystem";
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
    system: StorageSystemSchema.optional(),
  })
  .readonly();

export type SpaceInstance = z.infer<typeof SpaceInstanceSchema>;
