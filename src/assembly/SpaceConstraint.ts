export type SpaceConstraint = {
  readonly binId: string
  readonly hardMin: number
  readonly softMin: number
  readonly max?: number
}

export const createSpaceConstraint = (
  binId: string,
  hardMin: number,
  softMin: number,
  max?: number,
): SpaceConstraint =>
  max !== undefined ? { binId, hardMin, softMin, max } : { binId, hardMin, softMin }
