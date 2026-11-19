# Architecture decisions (`docs/jules/decisions`)

## Overview

Architecture decision records documenting early design choices for the packing engine.

## Interface

- `001-two-layer-packing-engine.md` — Accepted ADR (dated 2026-04-29) defining Layer 1 synchronous MaxRects BAF on the main thread and Layer 2 asynchronous global constraint solving in a Web Worker.

## Invariants

- `001-two-layer-packing-engine.md` is a historical accepted ADR whose original GLPK.js Layer 2 choice was later evaluated for Google OR-Tools CP-SAT WASM in [../follow-ups/001-or-tools-migration.md](../follow-ups/001-or-tools-migration.md).

## Side effects

- None; static Markdown documentation.

## Verification

- Run: `bun run format:check`
