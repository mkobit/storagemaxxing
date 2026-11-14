# Solver worker

## Overview

Provides the Web Worker entry point and handler factory (`solverWorker.ts`) that validates `SOLVE_SPACE` requests, lazily loads `/ortools-sat.wasm`, runs CP-SAT packing solves, and posts `SOLVE_SPACE_RESULT` responses.

## Interface

- `[solverWorker.ts:SolverWorkerRequest]` Exported request payload type for `SOLVE_SPACE` worker messages.
- `[solverWorker.ts:SolverWorkerResponse]` Exported response payload type for `SOLVE_SPACE_RESULT` worker messages.
- `[solverWorker.ts:createSolverWorkerHandler]` Exported factory `(post: PostResult, load?: () => Promise<WasmLoadResult>) => (data: unknown) => Promise<void>`.
- `[solverWorker.ts:self.addEventListener]` Worker `"message"` event listener that posts `SOLVE_SPACE_RESULT` via `self.postMessage` with transferable `responseBuffer`.

## Invariants

- `[solverWorker.ts:requestSchema]` Requests must have `type === "SOLVE_SPACE"`, a UUID `requestId`, a `spaceTemplate` matching `SpaceTemplateSchema`, and non-negative item dimensions and tolerances.
- `[solverWorker.ts:parametersSchema]` Solver parameters enforce `maxTimeInSeconds > 0` (default 5), `numWorkers === 1` (default 1), integer `randomSeed` in `[0, 2147483647]` (default 42), and boolean `logSearchProgress` (default `false`).
- `[solverWorker.ts:statusSchema, solverWorker.ts:solve, solverWorker.ts:createSolverWorkerHandler]` Response status is validated against `["OPTIMAL", "FEASIBLE", "INFEASIBLE", "MODEL_INVALID", "UNKNOWN"]`; request, load, solve, or decode failures return status `"MODEL_INVALID"` with an `errorCode`.
- `[solverWorker.ts:createSolverWorkerHandler]` WASM module loading is cached per handler under key `"solver"` via `loadOnce`.
- `[solverWorker.ts:solveWithCleanup]` Native WASM input and output pointers tracked during `invokeSolveProto` are freed in a `finally` block via `exports.FreeBuffer` and `exports.free`.

## Side effects

- `[solverWorker.ts:loadBrowserSolver]` Fetches `"/ortools-sat.wasm"` over HTTP and instantiates the WASM module.
- `[solverWorker.ts:solveWithCleanup]` Allocates and frees WASM linear memory and invokes `SolveProto`.
- `[solverWorker.ts:createSolverWorkerHandler]` Mutates an internal `Map` cache to store the pending or resolved WASM load promise.
- `[solverWorker.ts:self.addEventListener]` Registers a global `"message"` event listener on `self` and calls `self.postMessage` with transferables when running in a worker global scope (`self` defined, `self.postMessage` is a function, `document` undefined).

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
