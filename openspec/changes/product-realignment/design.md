# Design: product-realignment

## Context

The monorepo has seven packages but the product loop does not run end to end.
`apps/web` imports packer types yet never calls `packSpace()`; layout state is assembled manually in the store.
`packages/engine` has no source files and `packages/solver` (GLPK LP feasibility) is imported by nothing.
Eleven of twelve canonical specs govern agent process rather than product behavior, duplicating `AGENTS.md`.
Structural rules (DAG topology, purity) exist as prose; only ESLint functional rules and `import/no-cycle` are machine-enforced today.

## Goals / Non-Goals

**Goals:**

- Reduce the package graph to the golden path: `geometry → catalog → assembly → packer → store → web`.
- Wire the golden path so `packSpace()` output drives the rendered layout, verified by named tests.
- Replace prose process specs with machine-enforced guards (lint boundaries, named tests, CI).
- Make bead acceptance criteria executable so weaker agents have an objective definition of done.

**Non-Goals:**

- No new packing algorithms or constraint features (Layer 2 / solver work is deferred, not redesigned).
- No UI redesign; only the minimum wiring needed to render packed output.
- No changes to the Beads/Dolt toolchain itself.
- No 3D, CAD, or multi-space optimization (per Breadth of Rectangles strategy).

## Data Flow (Golden Path)

```
 catalog                  assembly                 packer
+-----------+  BinSpec   +------------+  Sketch2D +------------+
| systems & | ---------> | Sketch2D / | --------> | packSpace()|
| bin specs |            | Features / |           | (MaxRects) |
+-----------+            | Constraints|           +-----+------+
      ^                  +------------+                 |
      |                        ^                        | PackingResult
 geometry primitives           |                        v
 (Dimensions2D, OpenGrid)      |                  +------------+
      |                        |                  |   store    |
      +------------------------+----------------- (Zustand)   |
                                                  +-----+------+
                                                        |
                                                        v
                                                  +------------+
                                                  |  apps/web  |
                                                  | renders    |
                                                  | placements |
                                                  +------------+
```

## Decisions

### 1. Delete `engine` and `solver` rather than deprecate

`engine` has no source; `solver` has no consumers and carries GLPK complexity plus eslint-disable debt.
Git history preserves both; resurrecting solver later starts from a fresh spec, not stale code.
`openspec/config.yaml` context changes from "Two-Layer Packing Engine" to "Layer 1 (Packer) with Layer 2 deferred".

### 2. Import boundaries via ESLint `no-restricted-imports` per package

Enforce the DAG with per-package ESLint overrides restricting which `@storagemaxxing/*` modules may be imported, layered on the existing flat config.
This was chosen over dependency-cruiser to avoid a new tool; the existing lint gate already runs in CI and locally.
Each package may import only from layers strictly below it: `geometry` imports nothing; `catalog` only `geometry`; `assembly` only `catalog`/`geometry`; `packer` only `assembly`/`catalog`/`geometry`; `store` only `assembly`/`packer`/`geometry`/`catalog`; `web` may import all.

### 3. Spec requirements bound to named tests

Each requirement in `storage-layout/spec.md` cites the test file and test name that verifies it (e.g., `packages/packer/test/golden-path.test.ts > "packs starter bins into a 2x2 grid"`).
An agent closing a bead must show the named test passing; review checks the mapping, not the agent's judgment.

### 4. Golden-path wiring lives in `store`, packing stays pure

A pure selector in `packages/store` derives `PackingResult` from the active sketch by calling `packSpace()`; `apps/web` renders from that selector.
No new domain objects are introduced: the flow reuses the existing Zod-validated `assembly` schemas (`Sketch2D`, `Feature`, `SpaceConstraint`) and the packing result types (`PackingResult`, `ValidityState`).
If implementation discovers a needed intermediate type, it must be added to `assembly` with a Zod schema and flowed back into this design first.

**Flowback (sm-cmbc)**: enforcing the DAG exposed a pre-existing cycle — `packer/types.ts` imported `PlacedBin` from `assembly` while `assembly/bom.ts` imported `PackingResult` from `packer`.
The packing result types (`PackingResult`, `PackingMetrics`, `ValidityState`, `ConstraintFailure`, `PackingPhase`) moved to `packages/assembly/src/PackingResult.ts`; they stay as plain types (derived data, not boundary input, so no Zod schema).

**Flowback (sm-azsx)**: `SpaceInstance.templateId` had no registry to resolve against, so the store gained a `templatesById` state field (plus `addTemplate` action) holding existing Zod-validated `SpaceTemplate` values.
The selector is `selectPackedLayout` in `packages/store/src/layoutSelectors.ts`; the catalog-to-packer `BinSpec` conversion is exported as `toPackerBinSpec` for reuse by `apps/web`.

### 5. Process specs collapse into `AGENTS.md`

The eight removed specs restate `AGENTS.md` operational rails.
Any unique, still-relevant guidance (e.g., Jules task limits, claim-before-work) is verified present in `AGENTS.md` before deletion.
`AGENTS.md` gains a "Bead task contract" section: every implementation bead names exactly one package, one spec requirement ID, and a runnable acceptance command.

### 6. Meta-backlog disposition in Beads

Open `meta:*` and process-improvement beads are closed with reason `superseded-by:product-realignment` or deferred with `bd defer`; only beads representing real product or tooling defects survive triage.

## Adversarial Audit

- **Deleting solver breaks hidden imports**: audit found zero imports outside `packages/solver` itself, but `bun run typecheck` across the workspace is the backstop; CI fails the change if anything was missed.
- **GLPK/worker dependencies linger**: removing the package must also remove its entries from the root lockfile and any tsconfig references; `bun install --frozen-lockfile` in CI catches drift.
- **Boundary rules misfire on test files**: ESLint overrides must scope to `src/` so tests and fixtures can import freely; verified by running lint after the rule lands.
- **Named-test mapping rots**: a renamed test silently orphans a requirement; mitigated by keeping test names in one golden-path test file per package and checking the mapping during `openspec validate` review.
- **Spec removal loses unique process rules**: each removed spec's requirements are diffed against `AGENTS.md` before deletion; anything unique is merged in the same commit that deletes the spec.
- **Concurrent agents hit stale beads**: meta-bead closure happens in one session with `bd dolt push` immediately after, per the state-sync rules being folded into `AGENTS.md`.
- **Web render regression**: the Playwright golden-path E2E (automated-verification delta) is added before the store wiring changes, so a broken render fails CI rather than shipping silently.

## Risks / Trade-offs

- **Lost optimization work**: solver deletion discards working GLPK integration; accepted because it has no consumers and contradicts Breadth of Rectangles priorities. Recovery path: git history plus a future spec.
- **ESLint boundaries are convention-shaped**: `no-restricted-imports` checks specifiers, not true module graphs; sufficient for workspace aliases, revisit dependency-cruiser only if agents find bypasses.
- **Fewer specs means less written process**: weaker agents rely on `AGENTS.md` plus executable gates; if behavior drifts, the fix is more automation, not more prose.
- **Scope includes minimal product wiring**: wiring `packSpace()` into the store grows this change beyond pure cleanup, but a golden-path spec whose tests cannot pass would reproduce the exact misalignment this change exists to fix.
