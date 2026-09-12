# Follow-up: OR-Tools WebAssembly migration

## Context

The Phase 0 architecture assumes a two-layer split: synchronous 2D placement via MaxRects and asynchronous mathematical constraint validation via GLPK.js in a Web Worker.
GLPK.js solves linear and mixed-integer programs for count feasibility, but lacks constraint programming (CP) primitives.
Google OR-Tools contains CP-SAT, a SAT-based constraint solver equipped with native 2D interval variables (`AddNoOverlap2D`) and scheduling constraints.

## Objective

Evaluate the feasibility and concrete technical path for compiling Google OR-Tools to WebAssembly (WASM) for in-browser multi-space packing and constraint solving.

## Value proposition for Storagemaxxing

- **Native 2D non-overlap packing:** CP-SAT includes `AddNoOverlap2D([x_intervals], [y_intervals])`, solving exact 2D non-overlapping bin packing and fixed-obstacle exclusion directly.
- **Unified solver model:** Avoids writing hand-rolled heuristic branch-and-bound algorithms for multi-drawer allocation and reach-clearance exclusion zones.
- **Global multi-space constraints:** Solves assembly-level limits (`Σ count[i, space] ≤ limit[i]`) simultaneously with geometric placement feasibility.

## WebAssembly compilation path

Google OR-Tools can be compiled to WebAssembly using Emscripten (`emcmake`) and CMake.

### Build requirements & configuration

1. **Toolchain:** Emscripten SDK (`emsdk`) with Clang targeting `wasm32`.
2. **Subsystem pruning:** Disable unnecessary bindings and solvers (`-DBUILD_PYTHON=OFF`, `-DBUILD_JAVA=OFF`, `-DBUILD_EXAMPLES=OFF`, `-DUSE_SCIP=OFF`, `-DUSE_COINOR=OFF`).
3. **Core target:** Compile only `ortools::sat` (CP-SAT) and optionally `ortools::glop` (linear solver).
4. **Threading strategy:**
   - Multi-threaded mode requires `-s USE_PTHREADS=1` and `SharedArrayBuffer`, which mandates `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` HTTP headers.
   - Single-threaded mode sets `SatParameters.set_num_search_workers(1)` to run cleanly in any standard Web Worker without server isolation header requirements.
5. **Binary footprint:** Stripped CP-SAT WASM binary with Brotli/Gzip compression compresses to approximately 3–6MB, acceptable for an on-demand Web Worker module.

## TypeScript and WebAssembly bridge architecture

The recommended boundary between TypeScript and the C++ WASM module uses Google Protobuf wire format (`CpModelProto` and `CpSolverResponse`):

1. **Model generation in TypeScript:** Generate TypeScript models using `@bufbuild/protobuf` from `ortools/sat/cp_model.proto`.
2. **Byte transmission:** The TypeScript worker serializes the model to a `Uint8Array` buffer and passes it to the WASM export.
3. **Single C++ entrypoint:**
   ```cpp
   emscripten::val SolveProto(const std::string& serialized_proto, const std::string& serialized_params);
   ```
4. **Zero custom Embind churn:** All domain logic, constraint construction, and solution unpacking happen in typed TypeScript without maintaining bespoke C++ bindings.

## Trade-off matrix

| Solver                   | Strengths                                                     | Limitations                                       | Role in Storagemaxxing                                  |
| :----------------------- | :------------------------------------------------------------ | :------------------------------------------------ | :------------------------------------------------------ |
| **GLPK.js**              | Small payload (<500KB), zero build maintenance                | MIP/LP only, no CP-SAT, no 2D geometry primitives | Baseline constraint checker for Phase 0                 |
| **HiGHS WASM**           | Fast modern MIP solver, official pre-built WASM               | MIP only, no native 2D non-overlap primitives     | Direct drop-in upgrade for GLPK.js                      |
| **OR-Tools CP-SAT WASM** | Exact 2D interval non-overlap, unified allocation & placement | 3–6MB payload, requires Emscripten build pipeline | Strategic target for Layer 2 multi-space packing engine |

## Concrete implementation plan

1. **Phase 1 (Container build recipe):** Create a standalone Docker or GitHub Action build script compiling minimal `ortools-sat.wasm` and `ortools-sat.js` using Emscripten.
2. **Phase 2 (Protobuf definitions):** Add `cp_model.proto` code generation to `packages/packer` via Bun tooling.
3. **Phase 3 (Web Worker harness):** Implement a worker harness wrapping the WASM `SolveProto` call behind an asynchronous TypeScript interface.

## Linked beads

- Decision: [`docs/jules/decisions/001-two-layer-packing-engine.md`](file:///home/mkobit/workspace/mkobit/storagemaxxing/docs/jules/decisions/001-two-layer-packing-engine.md)
- Research task: [`sm-ppca`](file:///home/mkobit/workspace/mkobit/storagemaxxing/.beads)
- Tech: [`docs/jules/tech.md`](file:///home/mkobit/workspace/mkobit/storagemaxxing/docs/jules/tech.md)
