export type GridCoord = {
  readonly x: number
  readonly y: number
  readonly z?: number // Z is optional for 2D grids
}

export const createGridCoord = (x: number, y: number, z?: number): GridCoord =>
  z !== undefined ? { x, y, z } : { x, y }
