# Research reports (`docs/research`)

## Overview

Bounded, evidence-backed research reports auditing catalog data, comparison metrics, and synchronous packer physical-fit limits.

## Interface

- `catalog-evidence.md` — Audits all 131 built-in catalog entries against accessible upstream sources and recommends a custom-bin import slice before adding a fifth built-in catalog.
- `comparison-metrics.md` — Audits Options Mode and BOM totals on synthetic cases paired with `packages/store/src/comparisonProbe.test.ts`.
- `physical-fit.md` — Audits `packSpace` physical-fit behavior across 14 synthetic fixtures paired with `packages/packer/src/physicalFitProbe.test.ts`.

## Invariants

- Reports in this directory are non-binding research records; they cite historical `openspec/` specs and task-local `.sbx-task/` artifacts preserved for provenance.
- Probe findings in `comparison-metrics.md` and `physical-fit.md` stay reproducible against `packages/store/src/comparisonProbe.test.ts` and `packages/packer/src/physicalFitProbe.test.ts`.

## Side effects

- None; static Markdown documentation.

## Verification

- Run: `bun run format:check`
- Run: `bun test packages/packer/src/physicalFitProbe.test.ts packages/store/src/comparisonProbe.test.ts`
