export type Dimensions3D<T extends number = number> = {
  readonly width: T
  readonly height: T
  readonly depth: T
}

export const createDimensions3D = <T extends number>(
  width: T,
  height: T,
  depth: T,
): Dimensions3D<T> => ({
  width,
  height,
  depth,
})
