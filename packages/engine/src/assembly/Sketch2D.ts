import { SketchElement } from './SketchElement'
import { SketchId } from './SketchId'

export type Sketch2D = {
  readonly id: SketchId
  readonly name: string
  readonly elements: readonly SketchElement[]
}

export const createSketch2D = (
  id: SketchId,
  name: string,
  elements: readonly SketchElement[],
): Sketch2D => ({
  id,
  name,
  elements,
})
