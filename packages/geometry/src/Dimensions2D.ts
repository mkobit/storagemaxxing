export type Dimensions2D<T extends number = number> = {
  readonly w: T;
  readonly l: T;
};

export const createDimensions2D = <T extends number>(
  w: T,
  l: T,
): Dimensions2D<T> => ({
  w,
  l,
});
