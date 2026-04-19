export type Dimensions2D<T extends number = number> = {
  readonly width: T;
  readonly height: T;
};

export const createDimensions2D = <T extends number>(
  width: T,
  height: T,
): Dimensions2D<T> => ({
  width,
  height,
});
