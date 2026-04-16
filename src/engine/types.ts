import { PlacedBin } from '../assembly/PlacedBin'

export type PackingPhase = 'hardMin' | 'softMin' | 'cappedFill' | 'autoFill'

export type ValidityState = 'valid' | 'partial' | 'invalid'

export type ConstraintFailure = {
  readonly binId: string
  readonly reason: 'hardMin' | 'softMin'
  readonly required: number
  readonly placed: number
}

export type PackingMetrics = {
  readonly placedCounts: Readonly<Record<string, number>>
  readonly areaUtilization: number
  readonly failures: readonly ConstraintFailure[]
}

export type PackingResult = {
  readonly placedBins: readonly PlacedBin[]
  readonly metrics: PackingMetrics
  readonly validity: ValidityState
}

export const createConstraintFailure = (
  binId: string,
  reason: 'hardMin' | 'softMin',
  required: number,
  placed: number,
): ConstraintFailure => ({
  binId,
  reason,
  required,
  placed,
})

export const createPackingMetrics = (
  placedCounts: Readonly<Record<string, number>>,
  areaUtilization: number,
  failures: readonly ConstraintFailure[],
): PackingMetrics => ({
  placedCounts,
  areaUtilization,
  failures,
})

export const createPackingResult = (
  placedBins: readonly PlacedBin[],
  metrics: PackingMetrics,
  validity: ValidityState,
): PackingResult => ({
  placedBins,
  metrics,
  validity,
})
