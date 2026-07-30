# Retrospective: vite-web-foundation

## §0 Evidence

- **Commit Range**: `main..e0b54b7`
- **Tasks Completed**: 8/8 granular tasks from Beads database.
- **Beads Closed**: `sm-pu05`, `sm-vp9q`, `sm-dgto`, `sm-0i1g`, `sm-34op`, `sm-ytwn`, `sm-eomo`, `sm-5uqm`.
- **Test Status**:
  - Vitest: 2 tests passed (Toolbar component).
  - Playwright: 1 smoke test passed (Homepage & Toolbar visibility).
  - Manual: Verified static build with `vite build`.

## §1 Wins

- Successfully migrated to Vite + Bun, enabling HMR for both apps and monorepo packages.
- Established a semantic styling system with Tailwind CSS 4 using custom brand tokens.
- Reset the testing baseline, removing legacy unmaintained tests and adding clean Vitest/Playwright suites.
- Leveraged `resolve.dedupe` in Vite to resolve React version conflicts caused by multiple package versions.
- Enforced `data-testid` pattern in the `Toolbar` refactor to support future agentic vision.

## §2 Misses

- Initially forgot to dedupe React/React-DOM, leading to "Invalid Hook Call" errors during the first Playwright run.
- `bd query` output format for `tasks.md` was initially text-heavy, requiring manual conversion to the checkbox format for OpenSpec progress tracking.

## §3 Surprises

- Tailwind CSS 4's new `@import "tailwindcss"` and `@theme` syntax worked seamlessly with the Vite plugin without any PostCSS boilerplate.
- Vite's ability to resolve monorepo packages via aliases and direct pathing is extremely performant compared to previous `bun build` attempts.

## §4 Promote

- [x] Standardize `data-testid` requirement for all new UI components.
- [x] Use `@tailwindcss/vite` as the default for all future web apps in the monorepo.
- [x] Prefer Vitest for component unit testing over `bun:test` when DOM environment is required.
