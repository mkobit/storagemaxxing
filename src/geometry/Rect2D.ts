import { Point2D } from './Point2D'
import { Dimensions2D } from './Dimensions2D'

export type Rect2D<T extends number = number> = {
  readonly origin: Point2D
  readonly dimensions: Dimensions2D<T>
}

export const createRect2D = <T extends number>(
  origin: Point2D,
  dimensions: Dimensions2D<T>,
): Rect2D<T> => ({
  origin,
  dimensions,
})
