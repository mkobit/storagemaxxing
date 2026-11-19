# Jules reference docs (`docs/jules`)

## Overview

Condensed product, constraint, catalog, technology, and workflow briefs for autonomous Jules agents alongside historical architecture decisions and follow-up evaluations.

## Subdirectories & boundaries

- `decisions`: [./decisions/README.md](./decisions/README.md) — Architecture decision records (`001-two-layer-packing-engine.md`).
- `follow-ups`: [./follow-ups/README.md](./follow-ups/README.md) — Technical evaluation memos (`001-or-tools-migration.md`).

## Interface

- `catalog.md` — Summarizes `BinSpec` fields, system taxonomy, and steps to add a storage system catalog.
- `constraints.md` — Documents Gridfinity (`42mm`) and openGrid (`28mm`) dimensions, `84mm` common multiple, access orientation rules, and planned Layer 2 solver constraints.
- `product.md` — Summarizes core mission, five product principles, three product areas, and early user personas.
- `tech.md` — Summarizes the two-layer packing split, frontend stack (React 19, Zustand, Tailwind CSS), coding standards, and package layout.
- `workflows.md` — High-level operational loop referencing `../../.beads/PRIME.md`, `../../.beads/TAGS.md`, and sibling Jules docs.

## Invariants

- These documents are condensed historical briefs whose architecture details diverge in places from the current codebase.
- `catalog.md` instructs updating `packages/catalog/src/index.ts` (barrel files are now banned by `eslint.config.ts`) and names `catalogSource` values `csv` and `user` instead of `'csv_import'` and `'user_defined'`.
- `constraints.md` and `tech.md` describe a GLPK.js Layer 2 worker at `packages/solver/src/workers/constraintWorker.ts` and an SVG canvas; the current codebase implements OR-Tools CP-SAT WASM in `packages/packer/src/` and `apps/web/src/workers/solverWorker.ts` and renders on HTML `<canvas>`.

## Side effects

- None; static Markdown documentation.

## Verification

- Run: `bun run format:check`
