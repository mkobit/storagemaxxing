## Why

The `storage-layout` spec covers the golden path — a user picks a system, picks bins, gets a packed layout — but is silent about what happens when an input cannot be resolved.
The current implementation swallows two classes of failure with no observable signal:

1. `packages/store/src/layoutSelectors.ts` filters out constraints whose `binId` does not resolve in the catalog (`.filter((b): b is CatalogBinSpec => b !== undefined)`), so a typo or stale ID disappears from the layout without any warning to the user or test.
2. The same selector returns `null` when the active space's template is missing, so a broken `templateId` reference looks identical to "no active space" — neither the UI nor a test can distinguish them.

The packer itself already models failure well (`validity: "valid" | "partial" | "invalid"` plus `ConstraintFailure[]`), but that signal stops at the packer boundary.
The web layer also has no contract for how to surface `partial`/`invalid` validity — the E2E test only asserts the golden (valid) case, so a regression that produces a partial layout would still render and ship.

Together these gaps mean the product's promise — "the layout you see matches the bins you picked" — is not enforceable.

## What Changes

- Add a `Layout Resolution` requirement governing the store selector's behavior on unresolved inputs (unknown bin IDs, missing space template, no active space). Each case must produce a typed result that distinguishes "nothing selected" from "selection cannot resolve", and the unresolved IDs must be enumerated.
- Add a `Validity Surfacing` requirement to `Rendered Layout` so the web app must visually distinguish `valid` / `partial` / `invalid` packings, with the E2E test gating the partial case as well as the valid one.
- Add a Scenario to `Catalog Golden-Path Systems` clarifying that `findBinById` returns `undefined` (never throws) for unknown IDs, so the contract for "miss" is explicit at the catalog boundary.
- Add a Scenario to `Golden-Path Packing` for the empty-constraints case (`packSpace` with no constraints returns a `valid` empty result) so the empty case is contract, not coincidence.

## Capabilities

### New Capabilities

(None — this change extends the existing `storage-layout` capability with negative-path scenarios.)

### Modified Capabilities

- `storage-layout`: gains a `Layout Resolution` requirement, a `Validity Surfacing` requirement, and two new Scenarios on existing requirements. Behavior of the existing happy paths is unchanged.

## Impact

- Affected packages in the DAG: `store` (selector return type changes from `PackingResult | null` to a tagged discriminated union), `web` (must read the new tag and render `partial`/`invalid` states), `catalog` (Scenario only — no code change), `packer` (Scenario only — no code change).
- Affected tests: `packages/store/test/golden-path.test.ts` gains negative-path cases, `apps/web/e2e/golden-path.spec.ts` gains a partial-pack scenario, new unit-level tests for the catalog miss contract and the empty-constraints contract.
- Affected docs: `packages/store/src/AGENTS.md` Type Ownership grows with the new tagged result type; `apps/web` UI components gain a validity-state branch.

## Success Criteria

- `selectPackedLayout` returns a tagged result; no code path silently drops a constraint whose `binId` does not resolve.
- The web canvas visibly differentiates `valid`, `partial`, and `invalid` layouts (e.g., color, banner, badge) and the E2E test asserts the partial case.
- `packages/store/test/golden-path.test.ts` includes a test for the unknown-bin-ID path that asserts the unresolved IDs are surfaced, not filtered.
- `packages/catalog/test/golden-path.test.ts` includes a `findBinById` miss assertion.
- `packages/packer/test/golden-path.test.ts` includes an empty-constraints assertion.
- `bun run lint && bun run typecheck && bun test && bun run --filter @storagemaxxing/web e2e` all pass.
