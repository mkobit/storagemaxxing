# Documentation (`docs`)

## Overview

Product requirements drafts, UX briefs, user journeys, adjacent-project notes, Jules architecture docs, and evidence-backed research reports.

## Subdirectories & boundaries

- `jules`: [./jules/README.md](./jules/README.md) — Condensed product, constraint, catalog, tech, and workflow briefs plus architecture decisions and technical follow-ups.
- `research`: [./research/README.md](./research/README.md) — Non-binding, evidence-backed research reports paired with executable probe tests in `packages/*/src/`.

## Interface

- `2026-04-13-PRD.md` — Draft v0.5 Product Requirements Document covering personas, data model, vendor catalogs, space modeler, two-layer packing, Options Mode, and roadmap.
- `2026-04-13-ux-flows-v1.md` — First-draft UI brief outlining the five-screen hierarchy, live-reactive interactions, validity states, BOM export formats, and dark-theme density rules.
- `adjacent-projects.md` — Running list of adjacent shop and storage layout projects (`Shopspec`, `Sawdust`).
- `user-journeys.md` — Discovery output replacing the PRD personas with the unified Space planner role and five end-to-end journeys mapped to Playwright specs in `apps/web/e2e/`.

## Invariants

- `2026-04-13-PRD.md` and `2026-04-13-ux-flows-v1.md` are historical April 2026 drafts that predate the IndexedDB store (`storagemaxxing-db`), light/dark theme toggle, unified `BinSpec` union on `kind`, and OR-Tools CP-SAT WASM solver.
- `user-journeys.md` predates optional `price` and `priceApproximate` fields now defined in `packages/catalog/src/bin.ts` and references historical `openspec/specs/*` paths removed from the repository.
- Five Playwright specs in `apps/web/e2e/` (`workshop-drawer-planning.spec.ts`, `multi-space-bom.spec.ts`, `akromils-bin-selection.spec.ts`, `constraint-edit-refresh.spec.ts`, and `multi-space-round-trip.spec.ts`) map 1:1 to Journeys 1–5 in `user-journeys.md`.

## Side effects

- None; static Markdown documentation.

## Verification

- Run: `bun run format:check`
