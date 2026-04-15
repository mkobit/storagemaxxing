import { Rect2D } from '../geometry/Rect2D';
import { Line2D } from '../geometry/Line2D';

export type SketchElementType = 'rectangle' | 'line';

export type SketchRectangle = {
  readonly id: string;
  readonly type: 'rectangle';
  readonly geometry: Rect2D;
};

export type SketchLine = {
  readonly id: string;
  readonly type: 'line';
  readonly geometry: Line2D;
};

export type SketchElement = SketchRectangle | SketchLine;

export const createSketchRectangle = (id: string, geometry: Rect2D): SketchRectangle => ({
  id,
  type: 'rectangle',
  geometry,
});

export const createSketchLine = (id: string, geometry: Line2D): SketchLine => ({
  id,
  type: 'line',
  geometry,
});
