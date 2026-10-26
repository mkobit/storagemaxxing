# Client-side solver specification

## ADDED Requirements

### Requirement: Single-threaded WebAssembly compilation

The build toolchain SHALL compile Google OR-Tools CP-SAT into a single-threaded WebAssembly binary without `pthread` dependencies.
The compiled WebAssembly binary SHALL execute in browser environments without `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` headers.
The compressed WebAssembly binary payload SHALL not exceed 5 megabytes using Brotli or Gzip compression.

#### Scenario: Solver initializes without cross-origin isolation headers

- **GIVEN** a browser environment lacking `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers
- **WHEN** the Web Worker loads and instantiates the single-threaded `ortools-sat.wasm` binary
- **THEN** initialization succeeds without security exceptions or `SharedArrayBuffer` requirements

#### Scenario: Binary payload meets compressed size limit

- **GIVEN** the compiled `ortools-sat.wasm` output artifact
- **WHEN** the binary artifact is compressed using Brotli or Gzip compression
- **THEN** the resulting compressed file size is less than 5 megabytes

### Requirement: Binary Protobuf model bridge

The WebAssembly solver wrapper SHALL expose an entrypoint `SolveProto` that accepts serialized `CpModelProto` bytes and serialized `SatParameters` bytes.
The entrypoint SHALL return serialized `CpSolverResponse` bytes containing variable assignments, objective value, and solve status.
The WebAssembly solver wrapper SHALL export `FreeBuffer` to release native heap allocations after payload extraction.
The interface SHALL transfer model and response payloads via `Uint8Array` views on memory without custom Embind object wrappers.

#### Scenario: Solver executes serialized protobuf model

- **GIVEN** a serialized binary `CpModelProto` representing 2D interval non-overlap constraints
- **WHEN** the worker passes the serialized model buffer to `SolveProto`
- **THEN** the function returns a valid `CpSolverResponse` buffer containing placement coordinates

#### Scenario: Solver returns structured infeasible response

- **GIVEN** a serialized binary `CpModelProto` with mutually contradictory constraints
- **WHEN** the worker executes `SolveProto`
- **THEN** the function returns a valid `CpSolverResponse` buffer with status set to `INFEASIBLE`

#### Scenario: Native heap memory releases after execution

- **GIVEN** a response pointer returned by `SolveProto`
- **WHEN** the worker copies output bytes and calls `FreeBuffer`
- **THEN** native heap allocations release without memory leaks across successive solves

### Requirement: Pure functional model formulation

The packing package SHALL provide a pure function `buildCpModel` that translates a `SpaceTemplate` and bin specifications into a valid `CpModelProto`.
The function SHALL formulate 2D non-overlapping placement constraints using `AddNoOverlap2D` interval variables.
The function SHALL formulate obstacle exclusion intervals for all obstacles defined in the space template.
The formulation SHALL scale float dimensions to discrete integer domains using `COORD_SCALE = 1000`.
The formulation SHALL apply effective item footprints including tolerances `toleranceW` and `toleranceL`.
The formulation functions SHALL be 100% pure without `try`/`catch` blocks or thrown exceptions.

#### Scenario: Formulate non-overlapping placement intervals

- **GIVEN** a space template with positive dimensions and a list of bin specifications
- **WHEN** `buildCpModel` evaluates the inputs
- **THEN** the emitted `CpModelProto` contains an `AddNoOverlap2D` constraint spanning all bin interval variables

#### Scenario: Formulate obstacle exclusion zones

- **GIVEN** a space template containing fixed structural obstacles
- **WHEN** `buildCpModel` generates the constraint model
- **THEN** the emitted `CpModelProto` adds fixed interval variables blocking the obstacle regions

### Requirement: Web Worker asynchronous execution

The web application SHALL execute the WebAssembly solver within a dedicated Web Worker thread in `apps/web`.
The solver worker SHALL communicate with the main application thread using typed asynchronous message events and transferable ArrayBuffers.
The solver worker SHALL support job cancellation when a newer layout request arrives or when the solve exceeds a specified time limit.

#### Scenario: Solver runs without blocking the main UI thread

- **GIVEN** an active user interface rendering animations at 60 frames per second
- **WHEN** an asynchronous solve request begins execution inside the Web Worker
- **THEN** the main UI thread continues rendering without frame drops or input lag

#### Scenario: Solver terminates search upon cancellation

- **GIVEN** a running constraint search job inside the Web Worker
- **WHEN** the main thread dispatches a cancellation signal
- **THEN** the worker terminates search execution and releases solver resources

### Requirement: Deterministic solution decoding

The packing package SHALL provide a pure function `decodeCpResponse` that converts a `CpSolverResponse` into a canonical `PackingResult`.
Placed bin coordinates SHALL map integer solver grid units back to fractional or decimal space units using `COORD_SCALE = 1000`.
The decoder SHALL orient bins flat on the space floor using `createPoint3D(x / COORD_SCALE, 0, z / COORD_SCALE)`.
When a model is infeasible or partial, the function SHALL populate `metrics.failures` with explicit failure records.
The decoder functions SHALL be 100% pure without `try`/`catch` blocks or thrown exceptions.

#### Scenario: Decode optimal placement into PlacedBin records

- **GIVEN** a `CpSolverResponse` with status `OPTIMAL`
- **WHEN** `decodeCpResponse` processes the variable assignments
- **THEN** the returned `PackingResult` contains non-overlapping `PlacedBin` records with valid 3D origins

#### Scenario: Decode infeasible solve into constraint failure metrics

- **GIVEN** a `CpSolverResponse` with status `INFEASIBLE`
- **WHEN** `decodeCpResponse` processes the solver response
- **THEN** the returned `PackingResult` has `validity === "invalid"` and contains entries in `metrics.failures`
