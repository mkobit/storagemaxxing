export type Dimensions3D<T extends number = number> = {
  readonly w: T;
  readonly l: T;
  readonly h: T;
};

export const createDimensions3D = <T extends number>(w: T, l: T, h: T): Dimensions3D<T> => ({
  w,
  l,
  h,
});
