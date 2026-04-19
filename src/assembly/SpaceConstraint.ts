import { z } from "zod";
import { BinSpecIdSchema } from "./BaseTypes.js";

export const SpaceConstraintOffSchema = z
  .object({
    mode: z.literal("off"),
    binId: BinSpecIdSchema,
    lo: z.literal(0),
    hi: z.literal(0),
    hard: z.boolean(),
    color: z.string(),
  })
  .readonly();

export const SpaceConstraintAutoSchema = z
  .object({
    mode: z.literal("auto"),
    binId: BinSpecIdSchema,
    lo: z.literal(0),
    hi: z.null(),
    hard: z.literal(false),
    color: z.string(),
  })
  .readonly();

export const SpaceConstraintSoftSchema = z
  .object({
    mode: z.literal("soft"),
    binId: BinSpecIdSchema,
    lo: z.number().int().nonnegative(),
    hi: z.number().int().nonnegative().nullable(),
    hard: z.literal(false),
    color: z.string(),
  })
  .readonly();

export const SpaceConstraintHardSchema = z
  .object({
    mode: z.literal("hard"),
    binId: BinSpecIdSchema,
    lo: z.number().int().positive(), // hard constraints without a minimum make no sense per requirements
    hi: z.number().int().positive().nullable(),
    hard: z.literal(true),
    color: z.string(),
  })
  .readonly();

export const SpaceConstraintSchema = z
  .discriminatedUnion("mode", [
    SpaceConstraintOffSchema,
    SpaceConstraintAutoSchema,
    SpaceConstraintSoftSchema,
    SpaceConstraintHardSchema,
  ])
  .refine(
    (data) => {
      if (data.mode === "soft" || data.mode === "hard") {
        return data.hi === null || data.lo <= data.hi;
      }
      return true;
    },
    {
      message: "lo must be less than or equal to hi",
      path: ["lo"],
    },
  );

export type SpaceConstraintOff = z.infer<typeof SpaceConstraintOffSchema>;
export type SpaceConstraintAuto = z.infer<typeof SpaceConstraintAutoSchema>;
export type SpaceConstraintSoft = z.infer<typeof SpaceConstraintSoftSchema>;
export type SpaceConstraintHard = z.infer<typeof SpaceConstraintHardSchema>;

export type SpaceConstraint = z.infer<typeof SpaceConstraintSchema>;
