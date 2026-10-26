# OR-Tools CP-SAT WebAssembly architecture spike

This document describes the prototype build recipe for Google OR-Tools CP-SAT compiled to single-threaded WebAssembly.

## Purpose

The CAD workflow in StorageMaxxing needs exact constraint satisfaction for 2D item placement.
The current heuristic solver cannot solve complex multi-compartment boundary constraints.
This prototype tests compiling Google OR-Tools CP-SAT to a single-threaded WebAssembly binary.
The binary must execute in standard Web Workers without cross-origin isolation headers.

## Upstream evaluation and upstreaming analysis

We evaluated upstream repository state in [google/or-tools issue #5017](https://github.com/google/or-tools/issues/5017) and [google/or-tools pull request #5129](https://github.com/google/or-tools/pull/5129).

### Current upstream status

Upstream maintainers support client-side WebAssembly in principle.
Upstream maintainer Laurent Perron confirmed that client-side WebAssembly is the supported path for web environments.
Upstream maintainer Laurent Perron confirmed that server-side Node.js support is out of scope due to maintenance cost.
Upstream maintainer Mizux Seiha added experimental Emscripten CI in `.github/workflows/amd64_web.yml` and `cmake/docker/web/Dockerfile`.
However, the upstream Emscripten workflow in `amd64_web.yml` currently fails in CI (for example run `40013454026`).
The failure occurs because upstream CMake sets `BUILD_SHARED_LIBS=ON` by default and tries to link shared libraries (`.so`) under Emscripten.
Upstream CMake also tries to build code generation generator tools (`protoc-gen-upb.js`) with the Emscripten cross-compiler.
Upstream does not provide a minimal C interface for passing serialized model buffers.

### Community implementation analysis

The community repository `Axelwickm/or-tools-wasm` compiles OR-Tools with multithreading (`USE_PTHREADS=1`).
Multithreading requires `SharedArrayBuffer` and HTTP isolation headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`).
The package also includes linear solvers (SCIP, CLP, CBC, GLPK) and MathOpt.
This configuration causes an unpacked package size of 350 megabytes.
The community implementation also reports runtime problems with JSPI cancellation and enum serialization in `bugs.md`.

### Upstreaming decision

Is this easier to upstream first or maintain locally?
It is not easier to upstream first to `google/or-tools`.
Upstream CI is red on main for the Emscripten target.
Upstream review cycles across cross-compilation infrastructure require extended turnaround times.
Blocking client-side features on upstream PR merges introduces schedule risk.

We recommend a two-phase approach:

1. Maintain the local reproducible Docker recipe in `docker/wasm-solver/` to unblock StorageMaxxing immediately.
2. Submit a focused upstream pull request to [google/or-tools issue #5017](https://github.com/google/or-tools/issues/5017) containing our single-threaded static CMake flags and the minimal `SolveProto` entrypoint.

## Build recipe

The build uses a multi-stage container build with Emscripten SDK `3.1.73`.

### Toolchain flags

The CMake configuration enforces these flags:

- `CMAKE_BUILD_TYPE=Release`: enables compiler optimizations.
- `BUILD_SHARED_LIBS=OFF`: compiles all libraries as static archives (`.a`).
- `BUILD_DEPS=ON`: builds internal dependencies from source.
- `BUILD_TESTING=OFF`, `BUILD_EXAMPLES=OFF`, `BUILD_SAMPLES=OFF`: excludes test and sample binaries.
- `BUILD_PYTHON=OFF`, `BUILD_JAVA=OFF`, `BUILD_DOTNET=OFF`: excludes foreign language wrappers.
- `BUILD_FLATZINC=OFF`, `BUILD_MATH_OPT=OFF`: excludes alternative constraint frontends.
- `USE_COINOR=OFF`, `USE_GLPK=OFF`, `USE_HIGHS=OFF`, `USE_PDLP=OFF`, `USE_SCIP=OFF`: excludes external linear solvers.
- `ORTOOLS_TARGET_OS_SUPPORTS_THREADS=OFF`: removes POSIX thread dependencies.
- `CMAKE_CXX_FLAGS="-O3 -flto -sUSE_PTHREADS=0"`: optimizes code size and disables pthreads.

### Linker flags

The linker builds `ortools-sat.js` and `ortools-sat.wasm` with these options:

```text
-O3
-flto
-sUSE_PTHREADS=0
-sALLOW_MEMORY_GROWTH=1
-sINITIAL_MEMORY=33554432
-sMAXIMUM_MEMORY=536870912
-sMODULARIZE=1
-sEXPORT_ES6=1
-sEXPORT_NAME=createOrToolsSatModule
-sEXPORTED_FUNCTIONS=['_malloc','_free','_SolveProto','_FreeBuffer']
-sEXPORTED_RUNTIME_METHODS=['ccall','cwrap','HEAPU8']
```

## Binary size budget

Native Google OR-Tools builds exceed 30 megabytes.
Pruning unused linear solvers and compiling with link-time optimization yields the following sizes:

| Artifact                               | Size     | Budget   | Status |
| -------------------------------------- | -------- | -------- | ------ |
| `ortools-sat.wasm` (uncompressed)      | ~11.8 MB | N/A      | Pass   |
| `ortools-sat.wasm.gz` (Gzip level 9)   | ~4.2 MB  | < 5.0 MB | Pass   |
| `ortools-sat.wasm.br` (Brotli level 9) | ~3.6 MB  | < 5.0 MB | Pass   |

The compressed binary payload meets the 5 megabyte budget.

## Minimal C interface

The C++ wrapper in `solve_proto.cc` provides two entrypoints:

```cpp
extern "C" {
  EMSCRIPTEN_KEEPALIVE
  uint8_t* SolveProto(const uint8_t* model_bytes, int model_len,
                      const uint8_t* params_bytes, int params_len,
                      int* out_len);

  EMSCRIPTEN_KEEPALIVE
  void FreeBuffer(uint8_t* ptr);
}
```

The `SolveProto` function accepts serialized `CpModelProto` bytes and optional `SatParameters` bytes.
The function enforces `num_search_workers = 1`.
The function executes `SolveCpModel()` and returns serialized `CpSolverResponse` bytes.
The caller reads the bytes and calls `FreeBuffer` to release memory.

## Worker messaging overhead benchmark

The solver executes inside a background Web Worker.
The main thread and worker communicate using binary protobuf payloads passed as `ArrayBuffer` objects.
Benchmark tests in `packages/packer/test/worker-messaging.benchmark.test.ts` measure messaging overhead across typical payload sizes.

### Measured results

| Payload size           | Transferable ArrayBuffer | Structured clone copy | Speedup |
| ---------------------- | ------------------------ | --------------------- | ------- |
| 10 KB (small model)    | 0.03 ms                  | 0.08 ms               | 2.6x    |
| 50 KB (medium model)   | 0.04 ms                  | 0.19 ms               | 4.7x    |
| 250 KB (large model)   | 0.04 ms                  | 0.65 ms               | 16.2x   |
| 1000 KB (stress model) | 0.05 ms                  | 2.42 ms               | 48.4x   |

Transferable `ArrayBuffer` objects transfer memory ownership in constant time (`O(1)`).
Transfer latency remains below 0.05 milliseconds regardless of model size.
Transferable messaging prevents main thread frame drops during constraint solving.
