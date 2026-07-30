## Why

`apps/web` now has a full v1 component set (space manager, constraint editor, BOM, options/auto-fill, layout canvas — see `src/ui/App.tsx`), which was sm-8ywp's own stated precondition for Storybook adoption ("only after a basic v1 product exists").
A broader UI-polish push (tab bar, empty/loading states, responsive layout) is coming next, and iterating on individual components inside the full app (create a space, add bins, drive to the right state) is slower than viewing a component in isolation with fixture props.
`eslint-plugin-storybook` is already an unused root devDependency (`package.json`), and `storybook@10.3.6` core is already resolved transitively in `bun.lock` as its peer — this change is adding the actual tool the plugin was pinned for, or removing the plugin if adoption is rejected.
`apps/web/src/ui/AGENTS.md` states a preference for E2E testing over isolated component _testing_ ("We prefer End-to-End (E2E) testing over isolated component testing because it validates the integration of the UI, Store, and Solver").
Storybook here is scoped as a visual development/viewing tool, not a test-runner replacement: Playwright e2e remains the sole source of behavioral verification, and no existing test is migrated to or replaced by a story.

## What Changes

- Add Storybook (`storybook@10.5.2` + `@storybook/react-vite@10.5.2`, pinned as `apps/web` devDependencies — see design.md Decision 1 for why this replaces the already-resolved-but-mismatched `storybook@10.3.6`, and why `10.5.2` rather than the newer `10.5.4`) scoped to `apps/web`, reusing its existing Vite + Tailwind v4 + React setup rather than a parallel build config.
- Add a `.storybook/` config directory under `apps/web` (`main.ts`, `preview.ts`) that loads `src/index.css` (Tailwind tokens, dark-mode `.dark` class, fonts) and wraps every story in `ThemeProvider` so components render with real design tokens, matching how `index.tsx` mounts the app.
- Wire the already-installed `eslint-plugin-storybook` into the root flat config (`eslint.config.ts`), scoped to `*.stories.tsx` files.
- Add `apps/web/tsconfig.json` `include` coverage for `.storybook` and `*.stories.tsx` so typecheck and eslint's type-aware rules parse them (per `AGENTS.md`'s tsconfig-scope rule).
- Add stories for an initial slice of presentational, store-independent components to prove the isolation workflow end-to-end (exact component list is a design.md decision — candidates are components that take plain props rather than reading the Zustand store directly, e.g. `ThemeToggle`, `StrategyCard`, `BOMRow`/`BOMHeader`/`BOMSummary`, `ConstraintRow`).
  Exhaustive story coverage of every component is explicitly out of scope for this change; follow-on work adds stories as components are touched.
- Add a `build-storybook` script (`apps/web/package.json`) and wire it into `.github/workflows/ci.yml`'s `verify` job so broken stories fail CI the same way a broken app build would.

## Capabilities

### New Capabilities

- `storybook-dev-workflow`: a Storybook instance scoped to `apps/web` for viewing and developing UI components in isolation, themed consistently with the real app (Tailwind tokens, dark/light mode, fonts), with its own lint coverage and a CI-checked build.

### Modified Capabilities

(none — no existing spec's runtime requirements change; this is additive dev tooling)

## Impact

- **Affected packages (DAG):** none. `packages/geometry`, `catalog`, `assembly`, `packer`, `store` are untouched. This is entirely `apps/web`-scoped (new `.storybook/` dir, new `*.stories.tsx` files colocated with components, `package.json`/`tsconfig.json`/`vite.config.ts` edits) plus a root `eslint.config.ts` addition and a CI workflow addition.
- **New dependencies:** `@storybook/react-vite` and any required companion packages (exact set determined in design.md) added to `apps/web` devDependencies; `storybook` itself moves from a transitive/optional peer resolution to a direct pinned devDependency.
- **No changes to:** Playwright e2e suite, existing `bun test` unit tests, `packages/store` state management, or any runtime component behavior.

## Success Criteria

- `bun run --filter @storagemaxxing/web build-storybook` (or equivalent workspace-filtered script) succeeds and produces a static Storybook build with no broken stories.
- The initial story slice renders in Storybook with correct theming (light and dark) and no console errors.
- `bun run lint` passes with `eslint-plugin-storybook`'s rules active against `*.stories.tsx` files.
- `bun run typecheck` passes with `.storybook/` and `*.stories.tsx` included.
- `bun run lint && bun run typecheck && bun test` show no regressions to existing coverage.
