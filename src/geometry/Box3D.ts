import { Point3D } from './Point3D'
import { Dimensions3D } from './Dimensions3D'

export type Box3D<T extends number = number> = {
  readonly origin: Point3D
  readonly dimensions: Dimensions3D<T>
}

export const createBox3D = <T extends number>(
  origin: Point3D,
  dimensions: Dimensions3D<T>,
): Box3D<T> => ({
  origin,
  dimensions,
})
