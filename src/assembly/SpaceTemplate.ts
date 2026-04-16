import { AccessFace } from '../geometry/AccessFace'
import { Dimensions3D } from '../geometry/Dimensions3D'

export type SpaceTemplate = {
  readonly id: string
  readonly dimensions: Dimensions3D
  readonly accessFace: AccessFace
}

export const createSpaceTemplate = (
  id: string,
  dimensions: Dimensions3D,
  accessFace: AccessFace,
): SpaceTemplate => ({
  id,
  dimensions,
  accessFace,
})
