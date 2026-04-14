export interface Dimensions2D<T> {
  readonly w: T;
  readonly l: T;
}

export interface Dimensions3D<T> {
  readonly w: T;
  readonly l: T;
  readonly h: T;
}

export interface Rect2D {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface GridCoord {
  readonly col: number;
  readonly row: number;
}

export interface GridDimensions {
  readonly cols: number;
  readonly rows: number;
}

export type AccessFace = "top" | "front" | "top+front" | "all-sides";
export type SpaceType = "drawer" | "shelf" | "wall";

export const defaultAccessFace = (spaceType: SpaceType): AccessFace => {
  switch (spaceType) {
    case "drawer":
      return "top";
    case "shelf":
      return "front";
    case "wall":
      return "front";
    default:
      return "front";
  }
};
