# Generated OR-Tools SAT bindings (`packages/packer/src/gen/ortools/sat`)

## Overview

Generated TypeScript protobuf types, enums, and `@bufbuild/protobuf/codegenv2` schemas for `cp_model.proto` and `sat_parameters.proto`, produced by `protoc-gen-es` v2.16.0 via `buf.yaml` and `buf.gen.yaml`.

## Interface

- `CpModelProto`, `CpModelProtoSchema`, `CpSolverResponse`, `CpSolverResponseSchema`, `CpSolverSolution`, `CpSolverSolutionSchema`, `CpSolverStatus`, `CpSolverStatusSchema`, `IntegerVariableProto`, `ConstraintProto`, `NoOverlap2DConstraintProto`, `CpObjectiveProto`, `DecisionStrategyProto`, and `file_ortools_sat_cp_model` (`cp_model_pb.ts`) — Generated CP-SAT model, constraint, objective, and response types and schemas.
- `SatParameters`, `SatParametersSchema`, `file_ortools_sat_sat_parameters`, and `SatParameters_*` enums/schemas (`sat_parameters_pb.ts`) — Generated solver parameter types and enums.

## Invariants

- Generated with `protoc-gen-es` options `target=ts` and `import_extension=none` from `proto` (`buf.yaml`, `buf.gen.yaml`).
- Preserves schema invariants from `cp_model.proto` and `sat_parameters.proto` (even-length disjoint `domain` pairs in `IntegerVariableProto`, mutual exclusion of `objective` and `floatingPointObjective` in `CpModelProto`, and empty `variables` when `exprs` is set in `DecisionStrategyProto`).

## Side effects

- None.

## Verification

- Run: `bun test packages/packer`
