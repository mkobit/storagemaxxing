import { GridUnit } from './GridUnit'

export type GridDimensions = {
  readonly width: GridUnit
  readonly height: GridUnit
  readonly depth?: GridUnit // Depth is optional as a grid might just be 2D
}

export const createGridDimensions = (
  width: GridUnit,
  height: GridUnit,
  depth?: GridUnit,
): GridDimensions => ({
  width,
  height,
  ...(depth !== undefined ? { depth } : {}),
})
