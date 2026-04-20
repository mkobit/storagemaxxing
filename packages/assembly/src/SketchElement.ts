import { Rect2D } from "@storagemaxxing/geometry/Rect2D";
import { Line2D } from "@storagemaxxing/geometry/Line2D";
import { SketchElementId } from "./SketchElementId";

export type SketchElementType = "rectangle" | "line";

export type SketchRectangle = {
  readonly id: SketchElementId;
  readonly type: "rectangle";
  readonly geometry: Rect2D;
};

export type SketchLine = {
  readonly id: SketchElementId;
  readonly type: "line";
  readonly geometry: Line2D;
};

export type SketchElement = SketchRectangle | SketchLine;

export const createSketchRectangle = (
  id: SketchElementId,
  geometry: Rect2D,
): SketchRectangle => ({
  id,
  type: "rectangle",
  geometry,
});

export const createSketchLine = (
  id: SketchElementId,
  geometry: Line2D,
): SketchLine => ({
  id,
  type: "line",
  geometry,
});
