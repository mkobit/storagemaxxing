import { vec2, ReadonlyVec2 } from "gl-matrix";

export type Point2D = ReadonlyVec2;

export const createPoint2D = (x: number, y: number): Point2D => {
  return vec2.fromValues(x, y) as Point2D;
};
