# Retrospective: design-token-lint

## §0 Evidence

- **Commit Range**: `main..HEAD` (d030ffb, 5d13ef2, bae1ff5)
- **Tasks Completed**: 1.1, 1.2, 2.1 (all 3/3 in tasks.md)
- **Beads Closed**: sm-sbqr, sm-zo8s, sm-vwdk (all `meta:openspec:design-token-lint`, all P2)
- **Test Status**: `bun run lint`, `bun run typecheck`, `bun test` (root packages: 153 pass; `apps/web`: 68 pass), `playwright test e2e/constraint-editor-panel.spec.ts` (2 pass) all green after every commit; `bd lint` clean.

## §1 Wins

- Dependency ordering held exactly as designed: sm-sbqr and sm-zo8s landed first, so by the time sm-vwdk's rule was added, `bun run lint` was already clean with zero violations — the rule shipped green on the first run, no red-then-fix commit needed.
- The design doc's adversarial-review fix (negative-lookahead regex for `var(--...)` bracket references) held up untouched — copied the selector as specified and it worked correctly against all 6 real motion-token files on the first try.
- Verified both new lint rules actually fire (not silently no-op from a selector typo) by temporarily committing a probe file with known violations, then a second probe confirming the `var(--motion-*)` exemption — caught nothing, which itself would have been a red flag if the rules were inert.
- Screenshot-based visual check for the `text-[1.2rem]` → `text-xl` conversion was cheap: git-stash the fix, screenshot, pop the stash, screenshot again, compare. No dev-server restart needed since Vite HMR picked up both states.

## §2 Misses

- None — this change's scope was small and fully enumerated at design time (17 total literal/bracket sites, all accounted for), so there was no discovery of new work mid-implementation.

## §3 Surprises

- Nothing unexpected surfaced during implementation; the design doc's "grep of the current tree (verified, not inferred)" claim in Context held exactly — no additional hex/bracket sites turned up beyond the enumerated 17.

## §4 Promote

- [ ] Nothing to promote as a new standing rule — the existing "screenshot before/after for visual-adjacent changes" and "verify a new lint rule actually fires before trusting it" practices already covered this change; no new pattern emerged worth generalizing.
