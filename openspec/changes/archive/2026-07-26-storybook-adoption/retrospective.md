# Retrospective: storybook-adoption

## §0 Evidence

- **Commit Range**: `main..storybook-adoption` (10 commits: `b6ec4a3`..`956f9ef`)
- **Tasks Completed**: 6/6 task groups, 8/8 beads (`sm-8shp`, `sm-7pvd`, `sm-zie9`, `sm-ailr`, `sm-pmv3`, `sm-ljaw`, `sm-6vrs`, `sm-totw`)
- **Beads Closed**: `bd query 'label=meta:openspec:storybook-adoption AND status=closed'` → 8/8
- **Test Status**: `bun run lint && bun run typecheck && bun test` all pass; `bun run --filter @storagemaxxing/web build-storybook` succeeds; production `build` excludes all Storybook/story references (verified by grep against `apps/web/dist`); 19 story exports across 7 components verified rendering with zero console errors in both light and dark mode via a live `storybook dev` server + Playwright.

## §1 Wins

- The `~/.bunfig.toml` `minimumReleaseAge` install-time guard did its job: it blocked `storybook@10.5.4` (published the day before implementation) and forced a fallback to `10.5.2`, which is exactly the kind of supply-chain-timing protection it exists for. Design docs and beads were updated in place (flowback) rather than working around the guard.
- Reusing real domain factories for story fixtures (`createPackingResult`/`createPackingMetrics`, `createSpaceConstraint`, `ALL_BINS`) instead of hand-built objects caught a real branded-type distinction (`BinId` vs `PartId`) at typecheck time rather than needing separate investigation — the type system did useful work here.
- The independent adversarial review (a fresh subagent, not self-review) caught a version mismatch between proposal.md and design.md and a false "confirmed via rg" grep claim before any bead was claimed — cheap to fix at the design stage, would have been a documentation-trust problem later if it shipped.
- `@storybook/react-vite`'s automatic pickup of `apps/web/vite.config.ts` (DAG aliases + Tailwind plugin) worked exactly as documented with zero custom `viteFinal` code, including for the two components (`BOMRow`, `BOMHeader`) that import across `@storagemaxxing/catalog` and `@storagemaxxing/assembly` — the single flagged architecture risk in design.md did not materialize.

## §2 Misses

- `apps/web/storybook-static/` (the `build-storybook` output directory) was gitignored but not added to `eslint.config.ts`'s `ignores` array in the same pass — the first `bun run lint` after the config landed choked on a generated, minified bundle with ~10,800 errors. Caught and fixed within the same task (`sm-zie9`), but it should have been anticipated: `.gitignore` and ESLint's flat-config `ignores` are two separate lists that don't sync automatically, and this repo already had one precedent (`apps/web/dist` via `**/dist/**`) that should have prompted checking for the Storybook equivalent proactively.
- The initial design draft's Decision 3 claimed (via `rg -l "@storagemaxxing/store"`) that no story in the initial slice touched the store. Re-running that exact grep during adversarial review found `StrategyCard.tsx` in the results. The underlying conclusion survived (type-only import, elided at build time), but the claim as originally written was simply wrong — a live re-run during review, not the original authoring pass, is what caught it.

## §3 Surprises

- `mise exec bun@1.3.14` was needed throughout the implementation because this shell's `PATH` shadows the project-pinned Bun version with a different mise-installed version listed earlier on `PATH` — a pre-existing environment quirk unrelated to this change, filed separately as `sm-ke5a` rather than worked around silently.
- Playwright's browser binaries were not preinstalled for direct script-driven checks (only for `apps/web`'s own `test:e2e` harness), and `bun run <script>`'s module resolution follows the script file's own location, not the process's working directory — a scratch verification script only resolved the correct `playwright-core`/Chromium pairing once physically colocated inside `apps/web`.
- Storybook 9/10 fully absorbed the old `@storybook/addon-essentials` bundle into core (last published at `8.6.14`) — no addon packages were needed at all for baseline controls/actions/viewport functionality, simpler than the design initially worried it might need to account for.

## §4 Promote

- [x] The "confirmed via X, re-verify it yourself" adversarial-review discipline is already the standing `design-adversary`/`feature-probe` pattern — this change is one more data point that it catches real defects (2 for 2 across this and the prior `e2e-drill-fixture-seam` change), not just theoretical risk.
- [ ] Consider adding a repo-wide lint note (or a `bd remember`) that any new build-output directory added to `.gitignore` should be paired with an ESLint `ignores` entry in the same commit — this is the second time in this repo's history a generated-output directory has needed both (dist/, now storybook-static/), and both times the ESLint side was caught reactively rather than proactively.
