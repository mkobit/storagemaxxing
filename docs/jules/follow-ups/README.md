# Technical follow-ups (`docs/jules/follow-ups`)

## Overview

Technical evaluation memos assessing solver architecture migrations and implementation phases.

## Interface

- `001-or-tools-migration.md` — Evaluates migrating Layer 2 solving from GLPK.js/HiGHS to single-threaded Google OR-Tools CP-SAT (`num_search_workers = 1`) compiled to WebAssembly with a `@bufbuild/protobuf` bridge.

## Invariants

- `001-or-tools-migration.md` was written as a pre-implementation three-phase plan; Phases 1–3 are now implemented across `docker/wasm-solver/`, `packages/packer/`, and `apps/web/src/workers/`.
- Lines 61–63 in `001-or-tools-migration.md` contain machine-specific `file:///home/mkobit/workspace/mkobit/storagemaxxing/...` links preserved from the original memo.

## Side effects

- None; static Markdown documentation.

## Verification

- Run: `bun run format:check`
