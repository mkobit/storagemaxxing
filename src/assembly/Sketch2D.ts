import { SketchElement } from './SketchElement';

export type Sketch2D = {
  readonly id: string;
  readonly name: string;
  readonly elements: readonly SketchElement[];
};

export const createSketch2D = (id: string, name: string, elements: readonly SketchElement[]): Sketch2D => ({
  id,
  name,
  elements,
});
