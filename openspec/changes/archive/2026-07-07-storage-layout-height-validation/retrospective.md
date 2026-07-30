# Retrospective: storage-layout-height-validation

## §0 Evidence

- **Branches**: proposal on `task/sm-csu4-height-validation-proposal` (PR #202, merged); implementation on `task/sm-csu4-height-validation-impl`.
- **Tasks Completed**: 7/7 beads (`sm-csu4.2`–`sm-csu4.8`), plus the parent bug `sm-csu4`.
- **Beads Closed**: 8. One follow-up bug filed (`sm-tdrm`, discovered-from `sm-csu4`).
- **Test Status**: `bun run lint`, `bun run typecheck`, `bun test` (117 pass / 0 fail / 407 expects) all green.
- **Net Diff**: `packages/assembly/src/PackingResult.ts` — `ConstraintFailure` split into `CountConstraintFailure` | `HeightOverflowFailure`; `packages/packer/src/geometryUtils.ts` — new `isHeightEligible`; `packages/packer/src/packer.ts` — eligibility partition in `packSpace`, bundled `PackingContext`; `packages/packer/src/packerUtils.ts` — `HeightEligibility` threaded through `checkPhaseFailures`/`checkHardMinPhase`/`checkSoftMinPhase`, a latent `generateAutoFillRects` non-null-assertion bug fixed; both packages' `AGENTS.md` ts-export manifests updated; new/extended tests across `PackingResult.test.ts`, `geometryUtils.test.ts`, `packer.test.ts`, `packerUtils.test.ts`, `test/golden-path.test.ts`.

## §1 Wins

- The design's D1 claim ("existing phase logic already treats 'not in binMap' as zero rects, reused not reimplemented") was _mostly_ true and cheap to verify: implementing task 2.2 immediately threw a runtime `TypeError` in `generateAutoFillRects`, which had a non-null assertion (`binMap.get(c.binId)!`) that design.md had incorrectly assumed was already safe. TDD (writing the auto-mode exclusion test first) caught this before any commit landed, and the fix was a two-line change mirroring `generatePhaseRects`'s existing defensive pattern.
- The max-params ESLint rule (limit 4) forced a cleaner shape than the raw `heightIneligibleHeights, spaceHeight` pair threaded everywhere in the original design draft: bundling into one `HeightEligibility` type and a `PhaseRequirement` object for `checkPhaseFailures` reads better than the six-positional-argument version the design.md prose implied.
- The D6 package-manifest test caught the same class of drift the prior `storage-layout-observable-failures` change hit (AGENTS.md ts-exports going stale) — same railing, same one-command fix, second time it's paid for itself verbatim.
- Zero changes needed to `apps/web` or `packages/store`: the design's Impact section claim that `metrics.failures` has no readers outside `packages/{assembly,packer}` held exactly as predicted.

## §2 Misses

- Tasks 3.1 (`sm-csu4.5`) and 3.2 (`sm-csu4.6`) were specced as separable beads but turned out not to be independently testable or committable without introducing a throwaway placeholder call-site change. Implemented and committed together rather than force an artificial split — the right call in hindsight, but the task breakdown should have anticipated this coupling (both live in the same two-function call chain with no seam between them).
- The pre-existing `packages/packer/test/golden-path.test.ts` had a latent type hazard (`ConstraintFailure.placed`/`.required` accessed without narrowing) that `bun run typecheck` never caught, because the root `tsconfig.json`'s `include` array omits `packages/*/test` entirely — a gap in the repo's own tooling, unrelated to this change's design, discovered only because this change turned `ConstraintFailure` into a real discriminated union. Filed as `sm-tdrm` rather than fixed inline (fixing the tsconfig could surface unrelated type errors in `catalog`/`store`'s own `test/` directories, out of scope here).
- The Fable scoping agent for this change's proposal crashed mid-session (shared subagent quota exhaustion, not a design defect) after writing only `proposal.md`; the calling session completed `design.md`, the specs delta, and `tasks.md` directly. No design quality loss, but it broke the intended Fable-only scoping pattern for this particular change.

## §3 Surprises

- `bd create <child> --deps blocks:<other>` inverts the direction from what the flag name suggests — it makes the _new_ issue block the referenced one, not the other way around. All 12 dependency edges across this change and the sibling `layout-fit-to-viewport` change were wired backwards on first pass (`bd ready` surfaced each chain's terminal quality-gate task as immediately claimable). Caught before implementation started by cross-checking `bd ready` against the intended task order, not by `bd lint`. Filed `sm-h2kv` and a `bd remember` entry; this is worth fixing upstream or defaulting to `bd dep add` for chain wiring going forward.
- `createSpaceConstraint(binId, hardMin, softMin)` with no `max` argument makes the bin eligible for `generateAutoFillRects`'s "no cap" fill regardless of hard/soft mode — a test asserting "exactly one bin placed" without an explicit `max: 1` silently got 9 placements instead, from an unrelated auto-fill pass. Existing golden-path tests already used this pattern correctly (`createSpaceConstraint(bin.id, 1, 0, 1)`); the new height-validation tests needed the same care.

## §4 Promote

- [ ] Resolve `sm-tdrm` (root tsconfig `test/` typecheck gap) before another discriminated-union refactor touches `packages/*/test` files — the next one might not get caught by manual review.
- [ ] Resolve `sm-h2kv` (`bd create --deps blocks:` direction) — either fix upstream in `gastownhall/beads` or standardize this repo's convention on `bd dep add` for chain wiring so it stops recurring per-session.
- [ ] If a third packer failure category is ever added (beyond hard/soft-min and height-overflow), reconsider whether `ConstraintFailure`'s two-variant union should become a more general `reason`-keyed record before a third `if (binHeight !== undefined)`-style branch gets bolted onto `checkPhaseFailures`.
