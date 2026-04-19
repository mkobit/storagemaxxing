import { z } from "zod";
import { PartIdSchema } from "../catalog/BasePart.js";
import { Inches } from "../geometry/Inches.js";

export const SpaceTypeIdSchema = z.enum([
  "drawer",
  "shelf_bay",
  "open_shelf",
  "floor",
  "wall",
  "pegboard",
]);
export type SpaceType = z.infer<typeof SpaceTypeIdSchema>;

export const BinSpecIdSchema = PartIdSchema;
export type BinSpecId = z.infer<typeof BinSpecIdSchema>;

export const InstallationConstraintSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("noDrill"),
      surface: z.enum(["back", "sides", "top", "floor"]).optional(),
      notes: z.string().optional(),
    })
    .readonly(),
  z
    .object({
      type: z.literal("noAdhesive"),
      surface: z.enum(["back", "sides", "top", "floor"]).optional(),
      notes: z.string().optional(),
    })
    .readonly(),
  z
    .object({
      type: z.literal("maxWeightLbs"),
      value: z.number().positive(),
      notes: z.string().optional(),
    })
    .readonly(),
  z
    .object({
      type: z.literal("noWallMount"),
      notes: z.string().optional(),
    })
    .readonly(),
  z
    .object({
      type: z.literal("railPresent"),
      notes: z.string().optional(),
    })
    .readonly(),
  z
    .object({
      type: z.literal("custom"),
      notes: z.string().optional(),
    })
    .readonly(),
]);
export type InstallationConstraint = z.infer<
  typeof InstallationConstraintSchema
>;

// Since Inches is a branded number type without a custom Zod schema in geometry,
// we create a local Zod schema that produces an Inches type
export const InchesZodSchema = z.number().transform((n) => n as Inches);

export const DividerSchema = z
  .object({
    axis: z.enum(["x", "y", "z"]),
    position: InchesZodSchema,
    thickness: InchesZodSchema,
  })
  .readonly();
export type Divider = z.infer<typeof DividerSchema>;

export const ObstacleSchema = z
  .object({
    x: InchesZodSchema,
    y: InchesZodSchema,
    z: InchesZodSchema,
    w: InchesZodSchema,
    l: InchesZodSchema,
    h: InchesZodSchema,
    label: z.string(),
    permanent: z.boolean(),
  })
  .readonly();
export type Obstacle = z.infer<typeof ObstacleSchema>;

export const StorageCategoryIdSchema = z.string().brand<"StorageCategoryId">();
export type StorageCategoryId = z.infer<typeof StorageCategoryIdSchema>;

export const StorageCategorySchema = z
  .object({
    id: StorageCategoryIdSchema,
    name: z.string(),
    requiredCount: z.number().int().nonnegative(),
    notes: z.string(),
  })
  .readonly();
export type StorageCategory = z.infer<typeof StorageCategorySchema>;

export const AggregateConstraintSchema = z
  .object({
    binId: BinSpecIdSchema,
    minTotal: z.number().int().nonnegative(),
    maxTotal: z.number().int().nonnegative().nullable(),
    hard: z.boolean(),
  })
  .readonly();
export type AggregateConstraint = z.infer<typeof AggregateConstraintSchema>;

export const PlacedBinSchema = z
  .object({
    binId: BinSpecIdSchema,
    x: InchesZodSchema,
    y: InchesZodSchema,
    z: InchesZodSchema,
    w: InchesZodSchema,
    l: InchesZodSchema,
    h: InchesZodSchema,
  })
  .readonly();
export type PlacedBin = z.infer<typeof PlacedBinSchema>;

export const PackingStrategyIdSchema = z.string().brand<"PackingStrategyId">();
export type PackingStrategyId = z.infer<typeof PackingStrategyIdSchema>;

export const BOMItemSchema = z
  .object({
    binId: BinSpecIdSchema,
    quantity: z.number().int().positive(),
  })
  .readonly();
export type BOMItem = z.infer<typeof BOMItemSchema>;

export const BOMSchema = z
  .object({
    items: z.array(BOMItemSchema).readonly(),
    totalPrice: z.number().nonnegative(),
    isApproximatePrice: z.boolean(),
  })
  .readonly();
export type BOM = z.infer<typeof BOMSchema>;
