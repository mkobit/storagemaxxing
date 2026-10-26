## Why

Users design modular storage layouts for complex enclosures with obstacles and reach clearance zones.
The current Layer 1 packing engine in `packages/packer` uses a synchronous heuristic placement algorithm.
Heuristic placement algorithms cannot easily solve global constraints across multiple compartments.
Heuristic placement algorithms also struggle with non-rectangular void boundaries and fixed obstacles.
Google OR-Tools CP-SAT provides an exact constraint satisfaction solver with 2D interval non-overlap primitives.
Running Google OR-Tools CP-SAT inside client browsers eliminates backend server infrastructure costs.
Client-side execution keeps user spatial data private and enables offline operation.
Recent upstream developments in Google OR-Tools issue #5017 established initial WebAssembly compilation paths.
StorageMaxxing requires an official client-side solver architecture to evaluate and integrate this engine.

## Upstream strategy and packaging approach

StorageMaxxing does not fork or permanently diverge from upstream Google OR-Tools.
The repository uses reproducible local build scripts and Docker recipes with isolated patch files.
This approach isolates local build requirements without altering underlying upstream packages.
StorageMaxxing will document build evidence and upstream minimal single-threaded CMake presets to Google OR-Tools issue #5017 later.
Immediate development focuses on client-side feasibility, memory management, and pure TypeScript formulation contracts.

## What changes

- Add a reproducible Docker build recipe that compiles Google OR-Tools CP-SAT to single-threaded WebAssembly using local patch files.
- Configure Emscripten compilation flags to produce a pruned binary payload under 5MB compressed.
- Define a binary Google Protobuf bridge between TypeScript and the WebAssembly solver with memory deallocation exports.
- Implement pure functional model formulation functions in `packages/packer` that generate `CpModelProto` payloads.
- Implement an asynchronous Web Worker solver runtime in `apps/web` that prevents blocking the browser main thread.
- Implement pure solution decoding functions in `packages/packer` that map `CpSolverResponse` payloads to canonical `PackingResult` types.

## Capabilities

### New capabilities

- `client-side-solver`: Client-side constraint programming solver running Google OR-Tools CP-SAT compiled to WebAssembly inside a Web Worker.

### Modified capabilities

(none)

## Impact

- Affected packages in DAG:
  - `packages/packer`: Adds CP-SAT protobuf model formulation, constraint mapping, solution decoding, and solver worker message contracts.
  - `apps/web`: Hosts the Web Worker runtime, instantiates the WebAssembly solver module, and connects layout requests.
  - `packages/assembly`: Supplies `SpaceTemplate`, `PlacedBin`, and `PackingResult` schemas consumed by the solver.
  - `packages/geometry`: Supplies dimension and coordinate primitives.
  - `packages/catalog` and `packages/store`: `packages/store` dispatches solve requests to the worker; `packages/catalog` bin specs map to solver inputs.

## Success criteria

- A reproducible container build compiles Google OR-Tools CP-SAT to single-threaded WebAssembly.
- The compressed WebAssembly binary payload is smaller than 5MB with Brotli or Gzip compression.
- The single-threaded WebAssembly binary executes in standard browsers without `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` headers.
- The TypeScript formulation translates `SpaceTemplate` geometry and bin dimensions into valid binary `CpModelProto` buffers.
- The Web Worker solver solves 2D non-overlapping bin placement without freezing the user interface thread.
- The response decoder converts solver outputs into canonical `PackingResult` structures with deterministic placement coordinates.
