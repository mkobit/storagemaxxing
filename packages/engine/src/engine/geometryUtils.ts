import { BinSpec } from '../assembly/BinSpec.js'
import { SpaceTemplate } from '../assembly/SpaceTemplate.js'
import { Dimensions3D } from '../geometry/Dimensions3D.js'

export const getEffectiveFootprint = (
  bin: BinSpec,
): { readonly w: number; readonly l: number; readonly h: number } => ({
  w: bin.w + (bin.toleranceW ?? 0),
  l: bin.l + (bin.toleranceL ?? 0),
  h: bin.h + (bin.toleranceH ?? 0),
})

export const getEffectiveSpaceDimensions = (
  space: SpaceTemplate,
  defaultBinDepth: number,
): Dimensions3D => {
  const w = space.w ?? 0;
  const h = space.h ?? 0;
  const l = space.l ?? 0;
  return space.accessFace === 'front'
    ? {
        width: w,
        height: h,
        depth: Math.min(l, defaultBinDepth),
      }
    : {
        width: w,
        height: h,
        depth: l,
      }
}

export const getMaxBinDepth = (bins: readonly BinSpec[]): number =>
  bins.reduce((max, bin) => {
    const footprint = getEffectiveFootprint(bin)
    return footprint.l > max ? footprint.l : max
  }, 0)
