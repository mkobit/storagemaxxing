import { Point2D } from "./Point2D";

export type Line2D = {
  readonly start: Point2D;
  readonly end: Point2D;
};

export const createLine2D = (start: Point2D, end: Point2D): Line2D => ({
  start,
  end,
});
