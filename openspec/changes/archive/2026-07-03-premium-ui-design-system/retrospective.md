# Retrospective: premium-ui-design-system

## §0 Evidence

- **Commit Range**: `5f43da6..41eb559` (7 squash-merged PRs: #178, #181, #182, #183, #184, #185, #186)
- **Tasks Completed**: 7/7 in `tasks.md` (design review, token foundation, typography, theme toggle, three component migrations)
- **Beads Closed**: `sm-odxr`, `sm-ynun`, `sm-n7qt`, `sm-cmk3`, `sm-vj3p`, `sm-4gqq`, `sm-xwtr`, epic `sm-czzu`
- **Test Status**: Every PR passed `lint`, `typecheck`, `bun test` (packages + web), and the full Playwright e2e suite in CI before merge. Final state: 99 package unit tests, 18 web unit tests, 13 e2e specs, all green. `bun run --cwd apps/web build` and `typecheck` re-verified clean after the epic's last child closed.

## §1 Wins

- Landing the token foundation (`sm-ynun`) as a hard dependency before any component migration avoided the `index.css` merge-conflict risk called out in design.md's Adversarial Audit — no `@theme` conflicts across any of the 7 PRs.
- The `.glass-panel` shared class, introduced in the first component migration (`sm-vj3p`), was reused as-is by the next two (`sm-4gqq`, `sm-xwtr`) with zero rework — the "shared treatment" design intent held up in practice.
- Each component migration shipped its own Playwright spec asserting the concrete acceptance criterion (`backdrop-filter` non-`none` in both themes) rather than relying on visual inspection alone, so the criteria are now regression-tested, not just verified once.
- Small, single-bead-per-PR commits made each diff easy to review and squash-merge independently; no bead's work depended on another's PR merging first (aside from the token foundation).

## §2 Misses

- Repeatedly starting and killing a throwaway `bun run dev` process for each component's visual check was unnecessary churn — Vite's HMR would have let one dev-server instance serve all three visual checks across the session.
- `bd close` state was silently reverted to `in_progress` for `sm-vj3p` by a post-checkout hook after later `git checkout` calls (switching branches for `sm-4gqq`/`sm-xwtr`) picked up a stale `.beads/issues.jsonl` snapshot. Caught only when reviewing the epic's children list before archiving — a bead can appear open on disk while already merged to `main`. This is the same class of drift `sm-yh2k` (automate bd-close vs OpenSpec tasks.md checkbox consistency check) was filed to catch, and it also hit `tasks.md`'s checkboxes for `sm-odxr`/`sm-ynun` (closed but never checked off).
- I created `sm-xwtr`'s branch after already editing files against `main` instead of before — caught before committing, but it's a process gap worth watching for.

## §3 Surprises

- `sm-xwtr`'s named migration target, `primitives/ValidityBadge.tsx`, turned out to be dead code — never imported anywhere in `apps/web`. The validity badge users actually see is a separate, duplicate inline implementation in `LayoutCanvas.tsx` with its own hardcoded hex colors, which the bead's file list never named. Filed as `sm-0pro` (discovered-from `sm-xwtr`) rather than silently expanding this change's scope.
- `Toolbar.tsx` and `GoldenPathSetup.tsx` had no inline `style={{...}}` objects at all by the time `sm-xwtr` started — they'd already been written against Tailwind utility classes, just using Tailwind's generic gray palette (`bg-gray-100`, `border-gray-300`) instead of the semantic tokens. The bead's acceptance criterion (grep for hex literals) would have passed without touching them at all; migrating them to tokens was necessary to make them actually theme-aware, which the literal grep check didn't capture.
- The bead-defined "no inline hex literals" acceptance criterion, read literally, would also flag `GoldenPathSetup.tsx`'s `STARTER_COLORS` — categorical visualization fill-color data consumed pixel-for-pixel by `golden-path.spec.ts`, not UI chrome. Left untouched and documented in the PR/close reason rather than either breaking that test or silently deviating without explanation.

## §4 Promote

- [ ] Confirm `sm-yh2k` (automate bd-close vs OpenSpec tasks.md checkbox consistency check) also covers detecting bd state reverted by the post-checkout hook, not just checkbox drift — same root cause, same fix surface.
- [ ] Triage `sm-0pro` (dead `ValidityBadge.tsx` vs. `LayoutCanvas.tsx`'s duplicate inline badge) promptly since it's a live hex-literal/dead-code gap the design system missed.
