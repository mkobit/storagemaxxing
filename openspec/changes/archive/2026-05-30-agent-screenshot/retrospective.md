# Retrospective: agent-screenshot

## §0 Evidence

- **Files changed**: `.gitignore`, `AGENTS.md`, `apps/web/package.json`, `apps/web/tsconfig.json`, `package.json`, `apps/web/scripts/screenshot.ts` (new)
- **Tasks completed**: 5/5 (sm-cz0s, sm-3tko, sm-wdm0, sm-7o7s, sm-rxrl)
- **Beads closed**: All 5 via `bd close`
- **Test status**: Lint passes, typecheck passes. 3 pre-existing vitest failures on main unrelated to this change.
- **Verified**: Screenshot of running app captured successfully at `.screenshots/latest.png` showing full toolbar + canvas UI.

## §1 Wins

- Playwright + Chromium were already installed — zero new dependencies needed.
- Headless Chromium in WSL2 works without Xvfb; the `$DISPLAY` concern was a red herring.
- Full-page screenshot with hydration wait (`waitForSelector('[data-testid="toolbar"]')`) gives a clean, useful image of the real app state.
- The `--filter @storagemaxxing/web` pattern (matching existing root scripts) was the correct delegation approach.
- AGENTS.md section is minimal and actionable — any agent can follow it.

## §2 Misses

- First root `package.json` delegation used `bun --cwd apps/web run screenshot` which silently printed help instead of running; should have followed the existing `--filter` pattern from the start.
- `scripts/` directory was missing from `apps/web/tsconfig.json` include, causing an ESLint parse error discovered only at the quality gate stage — should be caught earlier by checking tsconfig before adding new TypeScript files.
- The first screenshot attempt captured a blank page because the Vite dev server had a stale optimization cache (504 errors); a clean server start resolved it. This is a fragile dependency on server state that agents could encounter.

## §3 Surprises

- The Zustand/IndexedDB hydration completes correctly in headless Playwright even with no prior stored state — the `onRehydrateStorage` callback fires as expected.
- The stale Vite dep optimization cache caused complete React module load failure (empty `#root` div), not a degraded render — this was a harder failure mode than expected.
- The `waitForSelector('[data-testid="toolbar"]')` approach is robust and reuses the existing smoke test contract, which is a nice accidental alignment.

## §4 Promote

- [ ] Add a note to AGENTS.md or dev docs warning that `bun run dev` should be run fresh (not reused from a stale session) before screenshotting, to avoid the Vite 504 issue.
- [ ] Consider adding `bun run screenshot` to the session start checklist in AGENTS.md so agents automatically ground themselves visually at session start.
- [ ] File a separate issue for the 3 pre-existing test failures (Toolbar unit tests + Playwright/vitest collision) — these are unrelated but worth tracking.
