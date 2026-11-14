# OR-Tools SAT protobuf schemas (`packages/packer/proto/ortools/sat`)

## Overview

Defines the upstream Google OR-Tools CP-SAT protobuf schemas (`cp_model.proto` and `sat_parameters.proto`) for constraint programming models, solver responses, and solver configuration parameters in package `operations_research.sat`.

## Interface

- `operations_research.sat` (`cp_model.proto`) — Proto3 schema defining `CpModelProto`, `CpSolverResponse`, `CpSolverSolution`, `CpSolverStatus`, `IntegerVariableProto`, `ConstraintProto`, `NoOverlap2DConstraintProto`, `CpObjectiveProto`, `FloatObjectiveProto`, `DecisionStrategyProto`, and related constraint/variable messages.
- `operations_research.sat` (`sat_parameters.proto`) — Proto2 schema defining `SatParameters` and its configuration enums (`VariableOrder`, `Polarity`, `ConflictMinimizationAlgorithm`, `BinaryMinizationAlgorithm`, `ClauseProtection`, `ClauseOrdering`, `RestartAlgorithm`, `MaxSatAssumptionOrder`, `MaxSatStratificationAlgorithm`, `SearchBranching`, `SharedTreeSplitStrategy`, `FPRoundingMethod`).

## Invariants

- Variable `domain` in `IntegerVariableProto` (`cp_model.proto`) is a sorted list of disjoint intervals with even length, `min_i <= max_i`, `max_i + 1 < min_{i+1}`, bounded to avoid `int64` overflow.
- `NoOverlap2DConstraintProto` (`cp_model.proto`) requires `y_intervals` to have the same size as `x_intervals`; `LinearConstraintProto`, `CumulativeConstraintProto`, `CircuitConstraintProto`, and `AutomatonConstraintProto` require matching parallel array sizes.
- `CpModelProto` (`cp_model.proto`) disallows specifying both `objective` and `floating_point_objective`.
- `DecisionStrategyProto` (`cp_model.proto`) requires `variables` to be empty if `exprs` is set.
- `SatParameters` (`sat_parameters.proto`) documents `solution_pool_size > 0`, positive `max_integer_rounding_scaling`, and `mip_max_activity_exponent` bounds to prevent integer overflow.

## Side effects

- None.

## Verification

- Run: `bun test packages/packer`
