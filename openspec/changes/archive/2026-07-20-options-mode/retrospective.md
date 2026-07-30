# Retrospective: options-mode

## §0 Evidence

- **Commit Range**: 26b1700 (sm-oukg) → 8a60dca (sm-8bf4) on branch `task/sm-oukg-options-mode-strategies-selector`, not yet merged (PR pending as of this writing).
- **Tasks Completed**: 4/4 — sm-oukg (store: `selectOptionsModeStrategies` preview selector), sm-7387 (store: `applySpaceStrategy` action), sm-sstq (web: `OptionsPanel` card grid + `App.tsx` third tab), sm-8bf4 (e2e coverage).
- **Beads Closed**: sm-prmh (parent), sm-oukg, sm-7387, sm-sstq, sm-8bf4 — all `CLOSED`.
- **Test Status**: `bun run lint` clean, `bun run typecheck` clean, `bun test` 153/153 pass (471 assertions, 26 files), `bun run --cwd apps/web test:e2e` 30/30 pass (including the 3 new options-mode scenarios).

## §1 Wins

- `tasks.md` checkboxes were hand-flipped immediately after each `bd close` this session, keeping the snapshot honest in real time — the prior change (installation-constraints) left all 4 checkboxes at `[ ]` despite full closure (the known sm-yh2k gap); this session avoided repeating that drift, even though the underlying automation gap is still open.
- The adversarial-review-caught bug documented in design.md (the id-first-vs-templateId-first ternary ordering in `applyStrategyInState`) was pinned by a dedicated regression test before/alongside implementation, exactly as design.md prescribed — no drift between the documented decision and the shipped code.
- A throwaway Playwright script driven against the real dev server (screenshot + interaction) verified the UI — 3 cards, best-value highlighting, tab-switch-on-commit — before locking in e2e assertions. Cheap confidence pass that caught nothing wrong but validated the approach before writing permanent coverage.
- The store package's `package-manifest.test.ts` (D6 — AGENTS.md ts-exports vs. source exports) caught every new-export omission automatically (`buildAutoFillConstraints`, `selectOptionsModeStrategies`, `applyStrategyInState`) — a cheap manifest-drift guard doing real work, not just ceremony.
- Store → web → e2e stayed strictly sequential exactly as scoped in tasks.md's dependency chain; no re-scoping or reordering needed mid-implementation.

## §2 Misses

- design.md's own embedded code snippets didn't survive contact with the repo's real lint rules and schema: the `selectOptionsModeStrategies` snippet's `Object.fromEntries(...) as Readonly<Record<...>>` cast tripped `@typescript-eslint/consistent-type-assertions`, and the `OptionsPanel` snippet's `activeSpace.template` referenced a field that doesn't exist on `SpaceInstanceSchema` (only `templateId`). Both were correct _decisions_, just unverified pseudocode — filed as sm-rdpp.
- The e2e spec's akromils card is never asserted to place any bins (only that the card renders); real-catalog akromils/12×12×2-template compatibility wasn't independently confirmed the way gridfinity's commit path was. Not a defect — the "zero eligible bins renders zero, not an error" path is already unit-tested against a synthetic catalog in sm-oukg's test suite — but it means the e2e suite doesn't independently corroborate real-catalog akromils placement.

## §3 Surprises

- `apps/web/AGENTS.md`'s "Type ownership" section already named `StrategyCard` before any options-mode code existed — a prior planning pass had pre-declared the type/component name, and it turned out to be exactly the right name for the component built this session.
- No PR/merge was needed to unblock retrospective writing this time — unlike installation-constraints (where the gap was only caught at the start of the _next_ session), this session's continuation prompt front-loaded the exact remaining work, so no `bd ready`/`openspec status` archaeology was needed before resuming.

## §4 Promote

- [ ] sm-rdpp (design.md snippets aren't lint/type-verified) should get a decision — either the design template gains a disclaimer, or this is closed as acceptable overhead.
- [ ] sm-jaog, sm-6b5e, sm-yh2k, sm-dwxg (pre-existing, not touched this session — carried over from installation-constraints' retrospective).
