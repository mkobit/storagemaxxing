# Web source

## Overview

Entrypoint and environment configuration for the web application, housing the React DOM root mount, Vite client type reference, and Bun/Happy DOM test setup.

## Interface

- No public exports; `index.tsx` serves as the browser application entrypoint and `test-setup.ts` serves as the Bun test preload module.
- Subdirectories:
  - [Web UI](./ui/README.md) — React UI shell, layout canvas, constraint editor, BOM view, strategy options, and visualization utilities.
  - [Solver worker](./workers/README.md) — Web Worker entrypoint and handler factory for `/ortools-sat.wasm` CP-SAT packing solves.

## Invariants

- `[index.tsx:container]` React root creation and rendering only execute if `document.getElementById("root")` is truthy.
- `[test-setup.ts:GlobalRegistrator.register]` Happy DOM globals are registered prior to dynamically importing `@testing-library/react`.

## Side effects

- `[index.tsx:createRoot]` Imports `./index.css`, queries `#root`, creates a React root, and renders `<React.StrictMode><ThemeProvider><App /></ThemeProvider></React.StrictMode>` at module load.
- `[vite-env.d.ts:vite/client]` Adds global Vite client ambient type declarations via triple-slash reference.
- `[test-setup.ts:GlobalRegistrator.register]` Mutates the global environment with Happy DOM globals at module load.
- `[test-setup.ts:afterEach]` Registers a `bun:test` `afterEach` hook that runs `@testing-library/react` `cleanup()`.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
