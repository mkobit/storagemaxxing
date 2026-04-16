import { BinSpec } from '../assembly/BinSpec'
import { SpaceTemplate } from '../assembly/SpaceTemplate'
import { Dimensions3D } from '../geometry/Dimensions3D'

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
  return space.accessFace === 'front'
    ? {
        width: space.dimensions.width,
        height: space.dimensions.height,
        depth: Math.min(space.dimensions.depth, defaultBinDepth),
      }
    : space.dimensions
}

export const getMaxBinDepth = (bins: readonly BinSpec[]): number =>
  bins.reduce((max, bin) => {
    const footprint = getEffectiveFootprint(bin)
    return footprint.l > max ? footprint.l : max
  }, 0)
