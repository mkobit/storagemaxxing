// Core value types — branded to prevent unit confusion
export type Inches = number & { readonly _brand: "inches" };
export type Millimeters = number & { readonly _brand: "mm" };

// Conversions
export const mmToIn = (mm: Millimeters): Inches => (mm / 25.4) as Inches;
export const inToMm = (inches: Inches): Millimeters => (inches * 25.4) as Millimeters;

// 2D and 3D geometry
export interface Dimensions2D {
  readonly w: Inches;
  readonly l: Inches;
}

export interface Dimensions3D {
  readonly w: Inches;
  readonly l: Inches;
  readonly h: Inches;
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

// Access face — which side of a space a user reaches in from
export type AccessFace = "top" | "front" | "top+front" | "all-sides";
export type SpaceType = "drawer" | "shelf" | "wall";

// Default access face by space type
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
