# Packer source (`packages/packer/src`)

## Overview

Implements 2D bin-packing via `maxrects-packer` (`packSpace`) and an OR-Tools CP-SAT Protobuf/WASM pipeline (`buildCpModel`, `instantiateOrToolsSatModule`, `invokeSolveProto`, `decodeCpResponse`).

## Interface

- `PackInput`, `createPackInput`, `createPackInputBasic`, `toPackInput` (`PackInput.ts`) — Packing item dimension input type and constructors.
- `COORD_SCALE`, `CpModelBuilderParams`, `scaleCoord`, `buildCpModel` (`cpModelBuilder.ts`) — Builds `CpModelProto` instances with scaled integer coordinates and `NoOverlap2DConstraintProto` exclusions.
- `decodeCpResponse` (`cpResponseDecoder.ts`) — Validates and decodes a `SolverResponse` into a `PackingResult`.
- `getEffectiveFootprint`, `getEffectiveSpaceDimensions`, `isHeightEligible`, `isFootprintEligible`, `getMaxBinDepth` (`geometryUtils.ts`) — Effective dimension and eligibility helpers.
- `packSpace` (`packer.ts`) — Executes multi-phase 2D bin packing using `MaxRectsPacker`.
- `RectsAccumulator`, `HeightEligibility`, `generatePhaseRects`, `sortRects`, `getPlacedCounts`, `checkPhaseFailures`, `getHardMin`, `getSoftMin`, `getMax`, `checkHardMinPhase`, `checkSoftMinPhase`, `generateAutoFillRects` (`packerUtils.ts`) — Phase-based rectangle generation, sorting, and failure checking helpers.
- `SolveProtoRawFn`, `FreeBufferFn`, `WasmMallocFn`, `WasmFreeFn`, `OrToolsSatWasmExports`, `WasmSolveError`, `WasmSolveResult`, `SolveProtoBufferFn`, `OrToolsSatModule`, `WasmSource`, `WasmModuleImports`, `WasmLoadError`, `WasmLoadResult`, `invokeSolveProto`, `instantiateOrToolsSatModule` (`wasmLoader.ts`) — WebAssembly module instantiation and `SolveProto` buffer invocation.
- `gen`: [./gen/README.md](./gen/README.md) — Generated OR-Tools CP-SAT TypeScript protobuf bindings.

## Invariants

- `scaleCoord` (`cpModelBuilder.ts`) scales floating-point dimensions by `COORD_SCALE` (`1000`) and rounds to `bigint`.
- `buildCpModel` (`cpModelBuilder.ts`) assigns 5 contiguous variables per item (`x`, `x_end`, `z`, `z_end`, `present`) followed by 4 variables per exclusion region (obstacles, dividers, `reach_clearance`), enforcing non-overlap via a single `NoOverlap2DConstraintProto` (`space_no_overlap_2d`), and maximizes count or area via negative coefficients on each item's `present` variable (`idx * 5 + 4`) with `scalingFactor = -1`.
- `decodeCpResponse` (`cpResponseDecoder.ts`) validates `OPTIMAL` or `FEASIBLE` status, `solution.length === model.variables.length`, unique variable names, values within declared domains, `present` in `{0n, 1n}`, and non-negative safe-integer scaled coordinates, otherwise returning `invalid` with `hardMin` failures; places decoded bins at `y = 0`.
- `getEffectiveSpaceDimensions` (`geometryUtils.ts`) clamps effective space depth `l` to `Math.min(l, defaultBinDepth)` when `space.accessFace === 'front'`.
- `packSpace` (`packer.ts`) configures `MaxRectsPacker` with `padding = 0`, `smart = true`, `pot = false`, `square = false`, `allowRotation = false`, `tag = false`, runs phases in order (`hardMin` -> `softMin` -> `max` -> `autoFill`), and places all bins at `y = 0`.
- `extractWasmExports` (`wasmLoader.ts`) requires `SolveProto`, `FreeBuffer`, `malloc`, `free`, and `memory` exports (unprefixed or `_`-prefixed), returning `MISSING_EXPORTS` if any are missing or invalid.
- `invokeSolveProto` (`wasmLoader.ts`) copies `responseBytes` out of WASM linear memory before freeing `responsePtr` and frees all allocated input/output pointers on both success and error paths.

## Side effects

- `executePhases` (`packer.ts`) mutates the `MaxRectsPacker` instance in-place across four phases via `packer.addArray(...)`.
- `invokeSolveProto` (`wasmLoader.ts`) allocates and frees WASM heap memory via `exports.malloc`, `exports.free`, and `exports.FreeBuffer`, mutates `exports.memory.buffer`, and invokes `exports.SolveProto`.
- `instantiateOrToolsSatModule` (`wasmLoader.ts`) compiles and instantiates a `WebAssembly.Module` via `WebAssembly.compile` and `WebAssembly.instantiate`.

## Verification

- Run: `bun test packages/packer`
