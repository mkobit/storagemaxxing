# Retrospective: add-opengrid-options-mode

## §0 Evidence

- **Commit Range**: `a095195..12ec73a` (3 commits, on branch `add-opengrid-options-mode`)
- **Tasks Completed**: sm-qamn, sm-t080, sm-ougp (3/3)
- **Beads Closed**: sm-qamn, sm-t080, sm-ougp — all `status=closed`, confirmed via `bd query 'label=meta:openspec:add-opengrid-options-mode AND status=closed'`
- **Test Status**: `bun test packages/store` 45/45 pass; `bun --cwd apps/web test src/ui/options` 68/68 pass; `bun run --cwd apps/web test:e2e -- options-mode.spec.ts` 3/3 pass; `bun run lint` clean; `bun run --cwd apps/web typecheck` clean

## §1 Wins

- The original `options-mode` design already made `COMPARABLE_SYSTEMS` a plain array reduced over generically in `selectOptionsModeStrategies` — adding `opengrid` there required zero logic changes, only a data change. Good prior design paid off directly.
- `opengrid`'s catalog (`OPENGRID_CATALOG`) was already spread into `ALL_BINS` by `sm-qrai`, so the moment `opengrid` joined `COMPARABLE_SYSTEMS`, real packing results appeared with no catalog-layer work needed in this change.
- The dev-server screenshot (via a one-off Playwright script reusing the e2e spec's exact interaction pattern) caught the layout visually before merge — 4 cards at `md:grid-cols-4` render legibly with correct best-value highlighting (Bins/SKUs), not just passing assertions.

## §2 Misses

- Original bead scoping (sm-ougp) only named `OptionsPanel.test.tsx` as the test to update. `apps/web/e2e/options-mode.spec.ts` also hardcoded the 3-card assertion and was found only while looking for a screenshot-driving pattern, not during design's grep pass. Design's "verify claims by grepping the actual code" rule was applied to selector/component code but not extended to e2e specs — worth broadening that grep step to `apps/web/e2e/**` whenever a fixed UI set changes.
- Committed the first task (sm-qamn) directly to local `main` before creating the feature branch — the exact mistake already tracked in `sm-iwpn`. Caught before push; recovered with the same `git branch` + `git reset --hard origin/main` + `git checkout` sequence documented there. This is now the third occurrence of this pattern in memory (sm-iwpn's acceptance criterion — "no recurrence in the next 5 sessions" — is not yet met).

## §3 Surprises

- No surprises in selector/type behavior — the `Record<ComparableStorageSystem, ...>` type widening surfaced exactly two `tsc` errors (`OptionsPanel.tsx` cardMetricsBySystem, `StrategyCard.tsx` SYSTEM_LABELS), both caught immediately by the project's typecheck-on-edit hook, confirming the design's adversarial-audit prediction that this was a mechanical, not logical, change.

## §4 Promote

- [ ] File a fresh recurrence note on `sm-iwpn` (or bump its priority) — this is the third recorded instance of committing to local `main` before branching; the acceptance criterion's 5-session no-recurrence window has not been met.
- [ ] Consider a lightweight repo convention/lint: when a bead's implementation touches a `SYSTEMS`/`COMPARABLE_SYSTEMS`-shaped fixed set in `apps/web/src`, grep `apps/web/e2e/**` for the same literal set before calling scoping complete.
