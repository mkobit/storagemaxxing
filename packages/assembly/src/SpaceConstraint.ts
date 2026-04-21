import { z } from "zod";
import { BinSpecIdSchema, BinSpecId } from "./BaseTypes.js";

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
    lo: z.number().int().nonnegative(), // soft minimum
    hardLo: z.number().int().nonnegative().optional(), // optional hard minimum
    hi: z.number().int().nonnegative().nullable(),
    hard: z.literal(false),
    color: z.string(),
  })
  .readonly();

export const SpaceConstraintHardSchema = z
  .object({
    mode: z.literal("hard"),
    binId: BinSpecIdSchema,
    lo: z.number().int().positive(), // hard minimum
    softLo: z.number().int().nonnegative().optional(), // optional soft minimum
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

export const createSpaceConstraint = (
  binId: string,
  hardMin: number,
  softMin: number,
  max?: number,
): SpaceConstraint => {
  if (hardMin > 0) {
    return {
      mode: "hard",
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      binId: binId as BinSpecId,
      lo: hardMin,
      softLo: softMin > hardMin ? softMin : undefined,
      hi: max ?? null,
      hard: true,
      color: "#000000",
    };
  }
  if (softMin > 0) {
    return {
      mode: "soft",
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      binId: binId as BinSpecId,
      lo: softMin,
      hi: max ?? null,
      hard: false,
      color: "#000000",
    };
  }
  return {
    mode: "auto",
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    binId: binId as BinSpecId,
    lo: 0,
    hi: null,
    hard: false,
    color: "#000000",
  };
};
