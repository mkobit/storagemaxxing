# Retrospective: storage-layout-observable-failures

## §0 Evidence

- **Commit Range**: branch `task/storage-layout-observable-failures-proposal` opened as PR #164. Single-branch proposal + implementation + archive in one slice.
- **Tasks Completed**: 2/2 beads (`sm-qqz1` design review, `sm-ik0u` implementation).
- **Beads Closed**: 2.
- **Test Status**: `bun run lint`, `bun run typecheck`, `bun test` (89 pass / 0 fail / 346 expects), and `bun --cwd apps/web run test:e2e` (3 pass including the new "non-valid pack surfaces a non-valid validity badge") all green.
- **Net Diff**: `packages/store/src/layoutSelectors.ts` rewritten to a tagged-union return; `apps/web/src/ui/LayoutCanvas.tsx` split into `ResolvedCanvas` + `renderResolution` + outer `LayoutCanvas` to keep complexity under the lint cap; `BOMPanel.tsx` adapted to project `LayoutResolution` → `PackingResult` before calling `computeAggregateBom`; `GoldenPathSetup.tsx` gains a "tiny space" demo button reused by the new E2E; 4 new store golden-path scenarios, 1 catalog miss test, 1 packer empty-constraints test.

## §1 Wins

- The product spec's silent failure modes — unknown bin IDs and missing template references — are no longer invisible. Both produce typed signals (`unresolvedBinIds`, `kind: "missing-template"`) at the selector boundary and visible badges/banners at the UI.
- Existing happy-path behavior is byte-identical: the original golden-path E2E still passes against the same `data-testid` selectors and pixel-sampling assertions.
- The D7 collision guard caught an unrelated drift mid-flight: the new `LayoutResolution` factory exports tripped the D6 manifest test until I refreshed `packages/store/src/AGENTS.md`. The railing from the prior change paid for itself again.
- One-line BOM adapter (`Object.entries(...).reduce(...)`) bridged the new tagged union to the existing `computeAggregateBom` signature without forcing a downstream refactor.

## §2 Misses

- Initial design specified a Zod schema for `LayoutResolution` referencing a non-existent `PackingResultSchema`. Caught at implementation start, required a FLOWBACK edit to `design.md` before code. The right pattern, but the original design draft should have checked for the dependency.
- Initial E2E test in the spec required `validity: "partial"`, but the starter set uses hard-min constraints with no soft-min, so the packer only yields `valid` or `invalid` — never `partial`. Second FLOWBACK relaxed the scenario to "non-valid pack" so the E2E is realistic against the actual starter setup. A future soft-constraint preset can re-tighten this.
- `LayoutCanvas` complexity jumped to 9 (cap is 8) after adding the three branches inline. Required a split into `ResolvedCanvas` + `renderResolution` — fine in the end but cost a round of refactoring after the first lint pass.
- Mid-flight changes to design and spec both went through FLOWBACK cleanly, but neither was anticipated in the original Adversarial Audit. The audit caught real risks (caller signature ripple, BOM signature drift) but missed both deviations the spec ultimately required.

## §3 Surprises

- `findBinById` already has a "returns undefined for non-existent id" assertion in `packages/catalog/src/lookup.test.ts`. The new spec citation lives under `packages/catalog/test/golden-path.test.ts` to keep the scenario co-located with the golden-path verification rather than splitting it across files.
- The CI canonical-edit guard added in `sm-pjno` last session is doing its job: this PR will only update canonical via the archive step, and the guard checks that an archive directory is added in the same diff.
- The `eslint` complexity rule (max 8) is a stricter railing than I expected — useful pressure to keep render branches small. Splitting on `kind` into a top-level dispatch + per-kind component is the natural pattern.

## §4 Promote

- [ ] Add a soft-constraint preset somewhere (probably as a `GoldenPathSetup` variant) so the `partial` validity state has E2E coverage and the spec's three-way validity distinction is exercised in CI.
- [ ] Consider hoisting `LayoutResolution` factory functions into a shared `Result` pattern if a second selector needs the same tagged-union shape — but only after the second case appears.
- [ ] The `data-testid="layout-unresolved-count"` indicator has no E2E coverage yet; only its absence is implicitly verified by the happy-path test. Add an explicit E2E using a constraint pointing to a non-catalog ID.
