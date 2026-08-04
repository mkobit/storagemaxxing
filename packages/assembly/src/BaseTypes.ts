import { z } from "zod";
import { PartIdSchema } from "@storagemaxxing/catalog/BasePart";
import { inches } from "@storagemaxxing/geometry/Inches";

export const SpaceTypeIdSchema = z.enum([
  "drawer",
  "shelf_bay",
  "open_shelf",
  "floor",
  "wall",
  "pegboard",
]);

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

// Since Inches is a branded number type without a custom Zod schema in geometry,
// we create a local Zod schema that produces an Inches type
const InchesZodSchema = z.number().transform(inches);

export const DividerSchema = z
  .object({
    axis: z.enum(["x", "y", "z"]),
    position: InchesZodSchema,
    thickness: InchesZodSchema,
  })
  .readonly();

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

export const PackingStrategyIdSchema = z.string().brand<"PackingStrategyId">();

export type BOMItem = {
  readonly binId: BinSpecId;
  readonly quantity: number;
};

export type BOM = {
  readonly items: readonly BOMItem[];
  readonly totalPrice: number;
  readonly isApproximatePrice: boolean;
};
