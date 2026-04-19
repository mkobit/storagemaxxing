import { Point3D } from '../geometry/Point3D'

export type PlacedBin = {
  readonly binId: string
  readonly origin: Point3D
}

export const createPlacedBin = (binId: string, origin: Point3D): PlacedBin => ({
  binId,
  origin,
})
