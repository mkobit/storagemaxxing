# Store tests (`packages/store/test`)

## Overview

Integration, selector, serialization, installation-constraint, and monorepo architecture-governance tests for `@storagemaxxing/store`.

## Interface

- `apply-space-strategy.test.ts` — Tests `applyStrategyInState` target space updates and shared-template constraint mirroring (no module exports).
- `golden-path.test.ts` — Tests `selectPackedLayout`, `selectPackingResultsBySpace`, unresolved/missing-template states, and aggregate BOM derivation (no module exports).
- `layout-installation-constraints.test.ts` — Tests `isBinInstallationAllowed`, `noDrill`/`railPresent` pre-pack filtering, and `maxWeightLbs` overflow reporting (no module exports).
- `options-mode-strategies.test.ts` — Tests `selectOptionsModeStrategies` across `akromils`, `gridfinity`, `opengrid`, and `schaller` (no module exports).
- `package-manifest.test.ts` — Enforces D6 `AGENTS.md` `ts-exports` and `## Import Rules` parity against `eslint.config.ts` `DAG_ORDER` and D7 cross-layer export-name uniqueness across all five workspace packages (no module exports).
- `sketch-serialization.test.ts` — Tests `serializeSketch` and `parseSketch` round-trips and malformed/invalid input rejection (no module exports).
- `store.test.ts` — Tests `updateConstraintInState`, `removeConstraintFromState`, and `setTemplateDrillableInState` idempotency (no module exports).

## Invariants

- All five packages (`geometry`, `catalog`, `assembly`, `packer`, `store`) must keep `packages/<pkg>/src/AGENTS.md` `ts-exports` and `## Import Rules` synchronized with actual source exports and `DAG_ORDER` in `eslint.config.ts`, with zero cross-package non-`*Schema` identifier collisions.
- Pure state helpers keep `constraintsBySpace[templateId]` synchronized with `space.constraints`, isolate `system` changes to target spaces, filter disallowed `drill`/`rail` bins without spurious failures, and emit `weightOverflow` only when placed weight exceeds `maxWeightLbs`.

## Side effects

- `package-manifest.test.ts` synchronously reads repository files via `node:fs` (`readdirSync`, `readFileSync`) across `packages/*/src`, `packages/*/src/AGENTS.md`, and root `eslint.config.ts`.
- The other six test files are pure in-memory `bun:test` suites with no IndexedDB access.

## Verification

- Run: `bun test packages/store/test`
