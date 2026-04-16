export type BinSpec = {
  readonly id: string
  readonly w: number
  readonly l: number
  readonly h: number
  readonly toleranceW?: number
  readonly toleranceL?: number
  readonly toleranceH?: number
}

type BinSpecParams = {
  readonly id: string
  readonly w: number
  readonly l: number
  readonly h: number
  readonly toleranceW?: number
  readonly toleranceL?: number
  readonly toleranceH?: number
}

export const createBinSpec = (params: BinSpecParams): BinSpec =>
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
    : { id: params.id, w: params.w, l: params.l, h: params.h }

export const createBinSpecBasic = (id: string, w: number, l: number, h: number): BinSpec => ({
  id,
  w,
  l,
  h,
})
