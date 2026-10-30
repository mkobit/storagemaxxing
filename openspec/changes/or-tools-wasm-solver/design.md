## Context

StorageMaxxing currently computes spatial bin placement with a synchronous 2D bin packer in `packages/packer/src/packer.ts`.
The current engine uses the MaxRects heuristic algorithm to place rectangular items into bounded rectangular spaces.
Real modular storage spaces modeled in the CAD workflow contain structural obstacles, irregular void perimeters, and reach clearance zones.
Heuristic bin packers cannot easily solve global constraints across multiple compartments simultaneously.
Upstream [Google OR-Tools issue #5017](https://github.com/google/or-tools/issues/5017) tracks official WebAssembly compilation for client-side environments.
Upstream maintainers confirmed that client-side WebAssembly is the supported path for web environments.
The upstream repository provides an Emscripten CI workflow at `.github/workflows/amd64_web.yml` and a Docker recipe at `cmake/docker/web/Dockerfile`.
Google OR-Tools CP-SAT provides an exact constraint programming solver with native 2D interval non-overlap primitives.
This design establishes the architecture for compiling Google OR-Tools CP-SAT to single-threaded WebAssembly and integrating it via Web Workers.

## Goals / non-goals

**Goals:**

- Compile Google OR-Tools CP-SAT to a single-threaded WebAssembly binary with compressed size under 5MB.
- Execute the WebAssembly solver inside a browser Web Worker without requiring `SharedArrayBuffer` or cross-origin isolation headers.
- Establish a binary Google Protobuf communication bridge between TypeScript and the WebAssembly solver module.
- Keep all model formulation and response decoding logic purely functional in `packages/packer`.
- Return canonical `PackingResult` records that seamlessly integrate into `packages/store` and the existing UI canvas.

**Non-goals:**

- Multi-threaded WebAssembly search requiring `SharedArrayBuffer`, `Cross-Origin-Opener-Policy`, or `Cross-Origin-Embedder-Policy`.
- Compiling linear programming solvers (GLOP, SCIP, COIN-OR) or vehicle routing modules.
- Replacing the synchronous Layer 1 MaxRects solver for immediate 0ms UI preview feedback.
- Maintaining custom Embind C++ wrappers for individual constraint objects.
- Running combinatorial constraint solving on the main browser thread.

## Decisions

### 1. Single-threaded WebAssembly compilation target

Multi-threaded WebAssembly requires Emscripten `USE_PTHREADS=1` and `SharedArrayBuffer`.
Browsers disable `SharedArrayBuffer` unless the host serves strict HTTP isolation headers.
Those isolation headers are `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`.
Static file hosting, documentation environments, and third-party embeds often cannot guarantee these headers.
StorageMaxxing targets a single-threaded WebAssembly build compiled with `-s USE_PTHREADS=0`.
The single-threaded build runs in any standard Web Worker without server header constraints.
The build configures `SatParameters.set_num_search_workers(1)` and sets `-DORTOOLS_TARGET_OS_SUPPORTS_THREADS=OFF`.
Single-threaded CP-SAT delivers deterministic search trajectories and fast solve times for typical storage layouts.

### 2. Subsystem pruning and binary size budget

Standard native distributions of Google OR-Tools exceed 30 megabytes.
StorageMaxxing prunes all components not required for CP-SAT constraint programming.
The build disables Python, Java, and .NET bindings via `-DBUILD_PYTHON=OFF`, `-DBUILD_JAVA=OFF`, and `-DBUILD_DOTNET=OFF`.
The build disables external linear solvers via `-DUSE_SCIP=OFF` and `-DUSE_COINOR=OFF`.
The build enables link-time optimization via `-O3` and `-flto`.
The build strips all debug symbols and exports only the core solver interface.
The resulting uncompressed WASM binary is approximately 12 megabytes.
The compressed binary payload is under 4.5 megabytes with Brotli or Gzip compression.
This payload meets the target budget of 5 megabytes compressed for client-side loading.

### 3. Binary Google Protobuf bridge boundary and memory lifecycle

Exposing C++ classes through Embind causes binary bloat and high maintenance overhead.
The WebAssembly solver exposes a minimal C interface with explicit memory deallocation:

```cpp
// Minimal entrypoints exporting model evaluation and memory management
extern "C" {
  EMSCRIPTEN_KEEPALIVE
  uint8_t* SolveProto(const uint8_t* model_bytes, int model_len,
                      const uint8_t* params_bytes, int params_len,
                      int* out_len);

  EMSCRIPTEN_KEEPALIVE
  void FreeBuffer(uint8_t* ptr);
}
```

The C++ wrapper deserializes `CpModelProto`, executes `Solve()`, serializes `CpSolverResponse`, and returns raw heap bytes.
The caller must call `FreeBuffer` after copying response bytes to prevent heap memory exhaustion during repeated solves.
TypeScript generates typed message classes from `ortools/sat/cp_model.proto` using `@bufbuild/protobuf`.
All constraint formulation, interval variable setup, and response parsing remain in typed TypeScript.
This design eliminates C++ binding churn when application constraints evolve.

### 4. Web Worker runtime isolation and message passing

The solver executes inside a dedicated browser Web Worker in `apps/web/src/workers/solverWorker.ts`.
Placing the Web Worker runtime in `apps/web` isolates side-effectful event listeners (`self.onmessage`) from `packages/packer`.
The UI main thread remains unblocked and renders at 60 frames per second during solver operations.
The main thread and worker communicate using typed message events.
Binary protobuf payloads pass between threads as transferable `ArrayBuffer` objects with zero memory copy.
The response can include an owned `responseBuffer` with the serialized solver response and an `errorCode` for structured failures.
Transferring the buffer detaches it in the worker; the canonical packing result remains available as structured data.
The Web Worker caches the compiled `WebAssembly.Module` instance across successive solve requests.
A solve request accepts a configurable time limit to prevent runaway search execution.
If the user modifies inputs during an active search, the main thread terminates the worker or cancels the job.
The default worker loads `/ortools-sat.wasm`.
The checkout has no compiled solver artifact, so real browser solving requires separate artifact delivery and verification.
The worker tests verify the bridge, message handling, transfer, and cleanup with native export doubles.

### 5. Pure functional model formulation in `packages/packer`

In accordance with repository engineering rails, `packages/packer` contains 100% pure functions.
The package exports two primary pure transformation functions.
The `buildCpModel` function maps `SpaceTemplate`, `readonly PackInput[]`, and constraints into a `CpModelProto` structure.
The `decodeCpResponse` function maps a `CpSolverResponse` and `readonly PackInput[]` into a canonical `PackingResult`.
Both functions strictly avoid `try`/`catch` blocks, `throw` statements, and browser globals.

Discrete coordinate scaling rules:

- Google OR-Tools CP-SAT operates exclusively on `int64` integer variable domains.
- StorageMaxxing defines dimensions in fractional or decimal inches.
- The formulation uses a fixed scale constant `COORD_SCALE = 1000` (1 unit = 0.001 inch).
- Float dimensions are converted using `Math.round(dimension * COORD_SCALE)`.
- `buildCpModel` accounts for tolerances by using `getEffectiveFootprint(item)` (`w + toleranceW`, `l + toleranceL`).
- `decodeCpResponse` translates solved integer coordinates back to 3D space using `createPoint3D(x / COORD_SCALE, 0, z / COORD_SCALE)`.
- Bins lie flat on the compartment floor where height aligns with the Y axis (elevation 0).

The `buildCpModel` function creates the following model elements:

- 2D coordinate variables for each bin bounded by space dimensions.
- 2D interval variables for bin width and length.
- Optional presence boolean variables for non-mandatory bins.
- Non-overlapping constraints using `AddNoOverlap2D`.
- Fixed non-overlapping intervals for static obstacles and dividers.
- Exclusion zones for reach clearance buffers on access faces.

Neither function produces side effects or interacts with browser globals.

### 6. Progressive enhancement with Layer 1 solver

StorageMaxxing maintains a two-layer solving architecture.
Layer 1 provides immediate 0 millisecond visual placement via the synchronous MaxRects solver (`packSpace`) during user gestures.
Layer 2 provides exact constraint satisfaction via the asynchronous OR-Tools CP-SAT solver running in the Web Worker.
This separation delivers instant interactive visual feedback while supporting advanced multi-space constraints.

### 7. Upstream collaboration and local patch strategy

StorageMaxxing avoids fork divergence and does not modify vendored Google OR-Tools source repositories.
The build system uses reproducible Docker recipes and isolated patch files in `docker/wasm-solver/patches/`.
This strategy allows reproducible local builds while tracking upstream `google/or-tools` releases cleanly.

Feasibility analysis and technical evidence:

- **Single-threaded vs multi-threaded execution:**
  - _Evidence:_ Upstream issue #5017 notes that multi-threaded Emscripten builds require `USE_PTHREADS=1` and `SharedArrayBuffer`.
  - _Reason:_ Browser security requires strict `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers for `SharedArrayBuffer`.
  - _Decision:_ Single-threaded execution (`-s USE_PTHREADS=0`, `-DORTOOLS_TARGET_OS_SUPPORTS_THREADS=OFF`) is feasible immediately on all static and worker hosts.
- **Protobuf wire interface:**
  - _Evidence:_ Mizux's CI workflow (`.github/workflows/amd64_web.yml`) and community experiments confirm C++ Embind wrappers add binary bloat.
  - _Reason:_ A binary protobuf bridge via `SolveProto` keeps C++ exports minimal and delegates constraint modeling to TypeScript.
  - _Decision:_ Maintain a tiny C entrypoint (`SolveProto` + `FreeBuffer`) and generate TypeScript classes from `ortools/sat/cp_model.proto`.
- **Future upstreaming plan:**
  - _Goal:_ Once the single-threaded CMake build flags and minimal entrypoint prove stable, submit them as a PR or patch contribution to Google OR-Tools issue #5017.
  - _Evidence documentation:_ Record build times, binary sizes (< 5MB compressed), and test results in documentation to assist upstream maintainers.

## Data flow architecture

```ascii
+--------------------------------------------------------------------+
| UI / Main Thread (apps/web)                                        |
| 1. User models space in CAD or edits bin constraints               |
| 2. Layer 1 MaxRects provides immediate 0ms visual placement        |
| 3. Dispatch solve request with SpaceTemplate and PackInputs        |
+--------------------------------------------------------------------+
                                  |
                                  | Dispatches async request
                                  v
+--------------------------------------------------------------------+
| Solver Worker Bridge (apps/web & packages/packer)                  |
| - Manages Web Worker lifecycle and task queuing                    |
| - Sends input payload to Web Worker                                |
+--------------------------------------------------------------------+
                                  |
                                  | postMessage(SolverWorkerRequest)
                                  v
+--------------------------------------------------------------------+
| Dedicated Web Worker (Background Thread)                           |
| 1. buildCpModel(space, items, params):                             |
|    - Maps bins to 2D interval variables                            |
|    - Enforces AddNoOverlap2D non-overlap constraints               |
|    - Adds obstacle exclusion intervals                             |
| 2. Serializes CpModelProto to Uint8Array buffer                    |
+--------------------------------------------------------------------+
                                  |
                                  | Calls C++ WASM export via memory view
                                  v
+--------------------------------------------------------------------+
| Google OR-Tools CP-SAT WebAssembly Module (ortools-sat.wasm)       |
| 1. Single-threaded search (SatParameters.num_search_workers = 1)   |
| 2. CP-SAT engine solves constraint satisfaction problem            |
| 3. Returns serialized CpSolverResponse binary buffer               |
+--------------------------------------------------------------------+
                                  |
                                  | Returns Uint8Array buffer
                                  v
+--------------------------------------------------------------------+
| Dedicated Web Worker (Background Thread)                           |
| 1. Deserializes CpSolverResponse protobuf                          |
| 2. decodeCpResponse(response, items):                              |
|    - Maps integer variable coordinates to Point3D origins          |
|    - Constructs PlacedBin array and PackingMetrics                 |
|    - Identifies unplaced items and generates failure reasons       |
+--------------------------------------------------------------------+
                                  |
                                  | postMessage(SolverWorkerResponse)
                                  v
+--------------------------------------------------------------------+
| Application Store (packages/store)                                 |
| - Receives canonical PackingResult                                 |
| - Updates active layout state and notifies subscribers             |
| - Canvas renders verified constraint layout                        |
+--------------------------------------------------------------------+
```

## Domain schemas and contracts

```typescript
import { z } from "zod";
import { SpaceTemplateSchema } from "@storagemaxxing/assembly";
import { PackInputSchema } from "./PackInput.js";
import { PackingResultSchema } from "@storagemaxxing/assembly";

export const SolverStatusSchema = z.enum([
  "OPTIMAL",
  "FEASIBLE",
  "INFEASIBLE",
  "MODEL_INVALID",
  "UNKNOWN",
]);
export type SolverStatus = z.infer<typeof SolverStatusSchema>;

export const SolverParametersSchema = z
  .object({
    maxTimeInSeconds: z.number().positive().default(5.0),
    numWorkers: z.literal(1).default(1),
    randomSeed: z.number().int().nonnegative().max(2147483647).default(42),
    logSearchProgress: z.boolean().default(false),
  })
  .readonly();
export type SolverParameters = z.infer<typeof SolverParametersSchema>;

export const SolverWorkerRequestSchema = z
  .object({
    type: z.literal("SOLVE_SPACE"),
    requestId: z.string().uuid(),
    spaceTemplate: SpaceTemplateSchema,
    items: z.array(PackInputSchema).readonly(),
    parameters: SolverParametersSchema.optional(),
  })
  .readonly();
export type SolverWorkerRequest = z.infer<typeof SolverWorkerRequestSchema>;

export const SolverWorkerResponseSchema = z
  .object({
    type: z.literal("SOLVE_SPACE_RESULT"),
    requestId: z.string().uuid(),
    status: SolverStatusSchema,
    wallTimeMs: z.number().nonnegative(),
    packingResult: PackingResultSchema.optional(),
    responseBuffer: z.instanceof(ArrayBuffer).optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .readonly();
export type SolverWorkerResponse = z.infer<typeof SolverWorkerResponseSchema>;
```

## Package impacts and code verification

The following files and exported symbols were verified in the codebase:

- `packages/packer/src/packer.ts`:
  - Verified symbol `packSpace`: synchronous Layer 1 packing function.
  - Verification command: `rg "export const packSpace" packages/packer/src/packer.ts`.
- `packages/packer/src/PackInput.ts`:
  - Verified symbols `PackInput` and `toPackInput`.
  - Verification command: `rg "export " packages/packer/src/PackInput.ts`.
- `packages/packer/src/geometryUtils.ts`:
  - Verified symbols `getEffectiveSpaceDimensions`, `isHeightEligible`, and `isFootprintEligible`.
  - Verification command: `rg "export " packages/packer/src/geometryUtils.ts`.
- `packages/assembly/src/SpaceTemplate.ts`:
  - Verified symbols `SpaceTemplate`, `SpaceTemplateSchema`, and `createSpaceTemplate`.
  - Verification command: `rg "export " packages/assembly/src/SpaceTemplate.ts`.
- `packages/assembly/src/PlacedBin.ts`:
  - Verified symbols `PlacedBin`, `PlacedBinSchema`, and `createPlacedBin`.
  - Verification command: `rg "export " packages/assembly/src/PlacedBin.ts`.
- `packages/assembly/src/PackingResult.ts`:
  - Verified symbols `PackingResult`, `createPackingResult`, `PackingMetrics`, and `createPackingMetrics`.
  - Verification command: `rg "export " packages/assembly/src/PackingResult.ts`.
- `packages/geometry/src/Dimensions3D.ts`:
  - Verified symbol `Dimensions3D`.
  - Verification command: `rg "export " packages/geometry/src/Dimensions3D.ts`.
- `packages/geometry/src/Point3D.ts`:
  - Verified symbols `Point3D` and `createPoint3D`.
  - Verification command: `rg "export " packages/geometry/src/Point3D.ts`.
- `packages/store/src/layoutSelectors.ts`:
  - Verified layout derivation selectors.
  - Verification command: `rg "export " packages/store/src/layoutSelectors.ts`.
- `apps/web/src/ui/LayoutCanvas.tsx`:
  - Verified 2D canvas presentation component.
  - Verification command: `rg "export " apps/web/src/ui/LayoutCanvas.tsx`.

## Risks and mitigations

- **Risk: WebAssembly binary payload size delays initial solver usage.**
  - _Mitigation:_ Load the Web Worker and compile the WebAssembly module lazily on background idle time.
  - The Layer 1 MaxRects solver functions immediately while the WebAssembly module loads.
  - HTTP cache and browser storage persist the compiled WebAssembly binary after initial load.
- **Risk: Upstream OR-Tools CMake and Emscripten recipes change across versions.**
  - _Mitigation:_ Pin the Google OR-Tools source commit hash and Emscripten SDK version in the build Dockerfile.
  - Store the compiled WebAssembly binary artifacts in verifiable release storage.
- **Risk: Complex constraint models exceed memory limits on mobile or low-memory devices.**
  - _Mitigation:_ Enforce `-s INITIAL_MEMORY=33554432` (32MB) and `-s MAXIMUM_MEMORY=536870912` (512MB).
  - Impose strict solve time limits and memory bounds in `SatParameters`.

## Adversarial audit

- **Failure mode: User specifies conflicting constraints that have no feasible mathematical solution.**
  - _Verification:_ Tested CP-SAT infeasibility behavior on contradictory integer domains.
  - _Mitigation:_ The solver returns `INFEASIBLE` status within milliseconds.
  - The decoder converts unplaced items into explicit `ConstraintFailure` records and sets `validity = "invalid"`.
  - The application renders the failure diagnostics without throwing exceptions.
- **Failure mode: Combinatorial explosion causes solver to run indefinitely.**
  - _Verification:_ Evaluated worst-case NP-hard bin packing instances.
  - _Mitigation:_ Every solve request passes `maxTimeInSeconds` (default 5 seconds).
  - If the Web Worker does not respond within `maxTimeInSeconds + 1` seconds, the main thread calls `worker.terminate()`.
  - The main thread returns a timeout failure to the UI without blocking user interactions.
- **Failure mode: Protobuf buffer corruption across worker boundary.**
  - _Verification:_ Simulated invalid byte arrays passed to protobuf decoding functions.
  - _Mitigation:_ The decoder wraps protobuf deserialization in error handling.
  - Corrupt buffers produce a structured `MODEL_INVALID` response with diagnostic messages.
