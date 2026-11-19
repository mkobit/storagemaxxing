# Catalog tests (`packages/catalog/test`)

## Overview

Integration and contract tests for `@storagemaxxing/catalog` golden-path systems and lookup helpers.

## Interface

- `golden-path.test.ts` — `bun:test` suite (`storage-layout: Catalog Golden-Path Systems`) with two tests and no module exports.

## Invariants

- `golden-path.test.ts` verifies `GOLDEN_PATH_SYSTEM` parses under `StorageSystemSchema` and every entry in non-empty `GOLDEN_PATH_STARTER_BIN_IDS` resolves in `ALL_BINS` via `findBinById` with matching `system` and positive dimensions.
- `golden-path.test.ts` verifies `findBinById` returns `undefined` without throwing for unknown `BinId` values.
- Included in root `tsconfig.json` (`"packages/*/test"`) and linted under `eslint.config.ts` test rules.

## Side effects

- None; pure in-memory `bun:test` assertions.

## Verification

- Run: `bun test packages/catalog/test`
