# Storagemaxxing blueprint

## System overview

Storagemaxxing is a Bun workspace monorepo for planning, packing, and visualizing modular storage layouts (Akro-Mils, Gridfinity, openGrid, and Schaller). It pairs pure TypeScript domain, geometry, catalog, and packing packages with a React/Vite web application, a Web Worker CP-SAT solver compiled from Google OR-Tools to WebAssembly, and repository verification scripts.

## Subdirectories & system boundaries

- `apps`: [apps/README.md](./apps/README.md) - User-facing `@storagemaxxing/web` React/Vite application, Web Worker solver entrypoint, Playwright e2e configuration, and UI tooling scripts.
- `docker`: [docker/README.md](./docker/README.md) - Multi-stage Emscripten Docker build recipe compiling Google OR-Tools CP-SAT `v9.11` into single-threaded `ortools-sat.js` and `ortools-sat.wasm`.
- `packages`: [packages/README.md](./packages/README.md) - Workspace libraries for geometry primitives (`geometry`), bin catalogs (`catalog`), domain schemas and BOM calculations (`assembly`), 2D bin packing and CP-SAT WASM bindings (`packer`), and Zustand + IndexedDB state management (`store`).
- `scripts`: [scripts/README.md](./scripts/README.md) - Bun CLI scripts enforcing test coverage thresholds, `.gitignore`/ESLint ignore parity, `.sbx` environment parity, and sandbox Beads context setup.

## Global invariants

- Workspace packages resolve directly to TypeScript sources (`packages/*/src`) via Vite and TypeScript path configuration, keeping domain schemas, units, and packing logic shared across the UI and Web Worker.
- Domain models in `@storagemaxxing/assembly` and `@storagemaxxing/catalog` validate inputs with Zod schemas and use branded types (`BinId`, `BinSpecId`, `PartId`, `SpaceInstanceId`, `SpaceTemplateId`, `Inches`, `Millimeters`).
- Both `@storagemaxxing/packer` (`packSpace`) and the OR-Tools CP-SAT WASM solver (`SolveProto` / `decodeCpResponse`) run single-threaded (`num_search_workers = 1` in WASM) and validate/free WASM heap buffers deterministically.
- Client store mutations in `@storagemaxxing/store` synchronize `constraintsBySpace` with `space.constraints` and invalidate cached `solverResultsBySpace` on template, constraint, or strategy changes.

## Global side effects

- `@storagemaxxing/store` persists application state to browser IndexedDB (`storagemaxxing-db`) via `idb-keyval`.
- `apps/web/src/workers/solverWorker.ts` fetches `/ortools-sat.wasm` and instantiates the WebAssembly solver inside a dedicated Web Worker.
- `scripts/` CLI tools spawn `bun test`, `bd`, and `sbx` subprocesses and write `.sbx-task/` state when explicitly invoked.

## System verification

- Run: `bun test`
