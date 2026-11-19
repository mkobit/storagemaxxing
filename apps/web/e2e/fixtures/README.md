# Web E2E fixtures (`apps/web/e2e/fixtures`)

## Overview

Provides Vite module-alias fixture modules injected during `@drill-fixture` Playwright end-to-end tests.

## Interface

- `[catalogWithDrillFixture.ts:ALL_BINS]` `ReadonlyArray<BinSpec>` appending synthetic `test-drill-bin` (`installation.type = "drill"`) to the real catalog `ALL_BINS`.
- `[catalogWithDrillFixture.ts:findBinById]` Re-exported helper from `../../../../packages/catalog/src/lookup`.
- `[catalogWithDrillFixture.ts:binsForDepth]` Re-exported helper from `../../../../packages/catalog/src/lookup`.

## Invariants

- `[catalogWithDrillFixture.ts]` Imports the real catalog via relative path `../../../../packages/catalog/src/lookup`, never `@storagemaxxing/catalog/lookup`, to avoid a self-referencing alias cycle when `E2E_DRILL_FIXTURE === "true"`.
- `[catalogWithDrillFixture.ts]` Mirrors the exact export surface of `packages/catalog/src/lookup.ts` and is activated only when `apps/web/vite.config.ts` observes `process.env.E2E_DRILL_FIXTURE === "true"`.

## Side effects

- None at module load; selection depends on `process.env.E2E_DRILL_FIXTURE` in `apps/web/vite.config.ts`.

## Verification

- Run: `bun run --filter @storagemaxxing/web typecheck`
- Run: `bun run --filter @storagemaxxing/web test:e2e`
