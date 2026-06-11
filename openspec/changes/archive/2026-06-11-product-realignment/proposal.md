# Proposal: product-realignment

## Why

The repository has accumulated more process infrastructure than product.
Eleven of twelve canonical specs describe agent coordination protocols rather than product behavior, and the only product spec has a TBD purpose.
The open Beads backlog is dominated by meta-work about the workflow itself.
The package graph is fragmented: `packages/engine` is an empty placeholder, `packages/solver` is an unintegrated LP layer with zero imports from the web app, and the core product loop is unwired — `apps/web` imports packer types but never calls `packSpace()`.
Weaker agents cannot reach conclusions in this environment because nothing executable defines "done"; alignment must come from machine-checkable contracts, not prose protocols.

## What Changes

This change prunes the repository down to its golden path and replaces prose rails with structural guards.

- Delete `packages/engine` (empty placeholder with no source).
- Delete `packages/solver` (Layer 2 constraint solver; unintegrated, deferred until multi-space allocation is a real requirement).
- Remove eight agent-process specs whose content is already covered by `AGENTS.md`, collapsing any unique guidance into it.
- Create a `storage-layout` product capability spec defining the golden path: select a storage system and bins, get a packed 2D layout rendered in the web app.
- Map every requirement in the new spec to a named test so agent work is verifiable by `bun test` rather than judgment.
- Add import-boundary lint enforcement for the package DAG `geometry → catalog → assembly → packer → store → web`.
- Tighten the Beads task contract in `AGENTS.md`: every implementation bead must name one package, one spec requirement, and a machine-checkable acceptance command.
- Update `openspec/config.yaml` context to reflect the single-layer engine (Layer 2 deferred).

**Layer impact**: Layer 1 (Packer) becomes the sole engine layer and the focus of the golden path.
Layer 2 (Solver) is removed from the codebase and deferred as a future layered feature.

## Capabilities

### New Capabilities

- `storage-layout`: the golden-path product capability — selecting a storage system and bin set produces a valid packed 2D layout rendered in the web UI, with each requirement bound to a named automated test.

### Modified Capabilities

- `monorepo-topology`: the DAG requirement gains lint-enforced import boundaries (machine-checked, not convention).
- `automated-verification`: gains a golden-path end-to-end verification requirement as the regression tripwire.

### Removed Capabilities

- `agentic-prime`: agent operational contract; superseded by `AGENTS.md`.
- `autonomous-patrol`: recurring agent duties; superseded by `AGENTS.md`.
- `beads-openspec-sync`: task hydration protocol; superseded by `AGENTS.md` and `bd mol` formulas.
- `cross-agent-handshake`: agent handover protocol; superseded by `AGENTS.md`.
- `hybrid-sandbox-policy`: agent sandbox boundaries; superseded by `AGENTS.md`.
- `operational-refinement`: spec flowback protocol; superseded by `AGENTS.md`.
- `state-sync-protocol`: state refresh and claiming protocol; superseded by `AGENTS.md`.
- `sync-automation`: task list compatibility rules; superseded by `AGENTS.md` and `bd mol` formulas.

## Impact

- **Removed code**: `packages/engine`, `packages/solver` (including its worker and GLPK dependency).
- **Specs**: eight spec directories removed from `openspec/specs/`; one new product spec added; two specs modified.
- **Docs**: `AGENTS.md` gains the bead task contract and absorbs any unique process guidance from removed specs.
- **Tooling**: ESLint (or dependency-cruiser) config gains import-boundary rules; CI remains lint → typecheck → test.
- **Config**: `openspec/config.yaml` architecture context updated to single-layer engine.
- **Beads**: open meta-process beads will be closed or superseded as part of execution.

## Success Criteria

- `bun run lint`, `bun run typecheck`, and `bun test` pass after package deletions.
- `openspec/specs/` contains only product- and code-facing specs (`storage-layout`, `monorepo-topology`, `engineering-standards`, `automated-verification`, `vite-web-foundation`).
- Every requirement in `storage-layout/spec.md` names the test that verifies it.
- An import that violates the package DAG fails lint.
- `bd ready` surfaces product work, not meta-work, as the top of the backlog.
