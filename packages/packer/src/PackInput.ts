import { z } from "zod";
import { BinSpec as CatalogBinSpec } from "@storagemaxxing/catalog/bin";

export const PackInputSchema = z.object({
  id: z.string(),
  w: z.number(),
  l: z.number(),
  h: z.number(),
  toleranceW: z.number().optional(),
  toleranceL: z.number().optional(),
  toleranceH: z.number().optional(),
});

export type PackInput = z.infer<typeof PackInputSchema>;

type PackInputParams = {
  readonly id: string;
  readonly w: number;
  readonly l: number;
  readonly h: number;
  readonly toleranceW?: number;
  readonly toleranceL?: number;
  readonly toleranceH?: number;
};

export const createPackInput = (params: PackInputParams): PackInput =>
  params.toleranceW !== undefined ||
  params.toleranceL !== undefined ||
  params.toleranceH !== undefined
    ? {
        id: params.id,
        w: params.w,
        l: params.l,
        h: params.h,
        toleranceW: params.toleranceW,
        toleranceL: params.toleranceL,
        toleranceH: params.toleranceH,
      }
    : { id: params.id, w: params.w, l: params.l, h: params.h };

export const createPackInputBasic = (
  id: string,
  w: number,
  l: number,
  h: number,
): PackInput => ({ id, w, l, h });

export const toPackInput = (bin: CatalogBinSpec): PackInput =>
  createPackInput({
    id: bin.id,
    w: bin.actual.w,
    l: bin.actual.l,
    h: bin.actual.h,
    toleranceW: bin.tolerance.w,
    toleranceL: bin.tolerance.l,
    toleranceH: bin.tolerance.h,
  });
