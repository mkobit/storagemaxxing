<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Architecture spike and WebAssembly build toolchain

- [x] 1.1 Prototype minimal client-side OR-Tools CP-SAT WebAssembly build recipe and Dockerfile ([sm-54wg.2](../../../.beads))
  - Requirement: `Single-threaded WebAssembly compilation`
  - Validation: `docker build -f docker/wasm-solver/Dockerfile -t ortools-wasm .`
- [x] 1.2 Implement WebAssembly module loader and instantiation smoke test in `packages/packer` ([sm-54wg.6](../../../.beads))
  - Requirement: `Single-threaded WebAssembly compilation`, `Binary Protobuf model bridge`
  - Validation: `bun test packages/packer/src/wasmLoader.test.ts`

## 2. Protobuf schemas and pure formulation

- [x] 2.1 Vendor `cp_model.proto` and configure `@bufbuild/protobuf` code generation in `packages/packer` ([sm-54wg.7](../../../.beads))
  - Requirement: `Binary Protobuf model bridge`
  - Validation: `bun test packages/packer`
- [x] 2.2 Implement pure `buildCpModel` function with `COORD_SCALE` and obstacle constraints in `packages/packer` ([sm-54wg.8](../../../.beads))
  - Requirement: `Pure functional model formulation`
  - Validation: `bun test packages/packer/src/cpModelBuilder.test.ts`
- [x] 2.3 Implement pure `decodeCpResponse` function mapping solver variables to canonical `PackingResult` in `packages/packer` ([sm-54wg.9](../../../.beads))
  - Requirement: `Deterministic solution decoding`
  - Validation: `bun test packages/packer/src/cpResponseDecoder.test.ts`

## 3. Web Worker runtime and solver integration

- [ ] 3.1 Implement Web Worker solver runtime in `apps/web` with transferable ArrayBuffers ([sm-54wg.4](../../../.beads))
  - Requirement: `Web Worker asynchronous execution`
  - Validation: `bun test apps/web/src/workers/solverWorker.test.ts`
- [ ] 3.2 Connect asynchronous solver worker actions to layout state in `packages/store` ([sm-54wg.10](../../../.beads))
  - Requirement: `Web Worker asynchronous execution`
  - Validation: `bun test packages/store/src/solverActions.test.ts`
- [ ] 3.3 Connect solver store actions and progress state to UI components in `apps/web` ([sm-54wg.11](../../../.beads))
  - Requirement: `Web Worker asynchronous execution`
  - Validation: `bun test apps/web/src/ui/LayoutCanvas.test.tsx`

## 4. Benchmark harness and quality gates

- [ ] 4.1 Implement benchmark harness comparing Layer 1 MaxRects and Layer 2 CP-SAT in `packages/packer` ([sm-54wg.12](../../../.beads))
  - Requirement: `Deterministic solution decoding`
  - Validation: `bun test packages/packer/test/solver-benchmark.test.ts`
- [ ] 4.2 Run full monorepo verification checks in Docker Sandbox
  - Validation: `sbx env exec .sbx/sbxenv.yaml -- mise run check`
