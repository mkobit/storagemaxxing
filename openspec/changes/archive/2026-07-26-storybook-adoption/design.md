## Context

`apps/web` builds and serves through Vite (`vite.config.ts`: `@vitejs/plugin-react` + `@tailwindcss/vite`, package-DAG aliases, port 5173).
Styling is Tailwind v4 via a single `@import "tailwindcss"` in `src/index.css`, with design tokens in a `@theme static` block and dark-mode overrides scoped under a `.dark` class on `<html>` (`ThemeProvider.tsx` toggles that class based on stored/system preference).
Root `package.json` already carries `eslint-plugin-storybook@10.4.6` as an unused devDependency, and `storybook@10.3.6` is already resolved in `bun.lock` — but only transitively, as `eslint-plugin-storybook`'s peer, and it does **not** satisfy that peer's own declared range (`storybook: "^10.4.6"`, confirmed via `rg '"storybook"' bun.lock` and `bun pm view eslint-plugin-storybook@10.4.6`).
That mismatch is inert today because nothing actually imports `storybook`; this change either fixes it (by pinning a real, peer-satisfying `storybook` version) or the mismatch stays latent.
`apps/web/src/ui/AGENTS.md` documents a philosophy of preferring E2E tests over isolated component _tests_ — Storybook here is a viewing/development tool, not a test runner, so no existing test moves and none of `ui/AGENTS.md`'s guidance is contradicted.

## Goals / Non-Goals

**Goals:**

- Get a working Storybook instance for `apps/web`, reusing its real Vite/Tailwind/theming setup, so a component can be viewed in isolation with fixture props instead of driving the full app to the right state.
- Fix the latent `storybook`/`eslint-plugin-storybook` peer mismatch as a side effect of pinning a real version.
- Wire `eslint-plugin-storybook` (already installed, currently dead weight) into the flat config.
- Prove the workflow end-to-end with a small slice of real component stories, themed correctly in both light and dark mode.
- Catch broken stories in CI via a `build-storybook` step, the same way a broken app build is already caught.

**Non-Goals:**

- Migrating every `apps/web` component to a story. Only presentational, store-independent components get stories in this change (see Decisions).
- Replacing or reducing Playwright e2e coverage. `ui/AGENTS.md`'s "prefer E2E over isolated component testing" stance is about _test_ strategy and is unchanged.
- Visual regression / screenshot-diff tooling on top of Storybook — that's the separate, already-filed `sm-t70m`.
- `LayoutCanvas`: it renders to a `<canvas>` 2D context and reads `getComputedStyle` at draw time for theme colors (see `index.css` comments), needs real element sizing/`ResizeObserver` behavior, and isn't a presentational props-only component. Deferred to follow-on work once the isolation workflow is proven on simpler components.

## Decisions

### 1. Package placement and pinned versions

Add to `apps/web/package.json` devDependencies (not root): `storybook@10.5.2` and `@storybook/react-vite@10.5.2`.

- `storybook`'s current `latest` dist-tag is `10.5.4` (confirmed via `bun pm view storybook@10.5.4`), but the user's global `~/.bunfig.toml` sets `minimumReleaseAge = 604800` (7 days) — `10.5.4` was published 2026-07-24, one day before implementation, so `bun add` rejected it (`error: No version matching "storybook" found for specifier "10.5.4" (blocked by minimum-release-age: 604800 seconds)`). `10.5.2` (published 2026-07-16, confirmed via `bun pm view storybook time`) is the newest version older than the 7-day window.
- `10.5.2` is the version `@storybook/react-vite@10.5.2` requires via its own peer range (`storybook: "^10.5.2"`, confirmed via `bun pm view @storybook/react-vite@10.5.2 peerDependencies`) — the framework package pins lockstep to core in Storybook 10, so the release-age constraint and the lockstep constraint were resolved together by picking the same version for both.
- This also satisfies `eslint-plugin-storybook@10.4.6`'s `storybook: "^10.4.6"` peer range, fixing the existing mismatch.
- `@storybook/react-vite@10.5.2`'s other peers (`vite: "^5 || ^6 || ^7 || ^8"`, `react`/`react-dom: "^16.8 || ^17 || ^18 || ^19"`, `typescript: ">=4.9.x"`) are all satisfied by `apps/web`'s existing `vite@8.1.3`, `react@19.2.7`, and root `typescript@6.0.3`. Verified in practice, not just by peer-range arithmetic: `bun install --frozen-lockfile` resolved with no peer warnings, and `bun run --filter @storagemaxxing/web build` (main app) succeeded unaffected after the add.
- No addon packages (`@storybook/addon-essentials` et al.) are added: `@storybook/addon-essentials` stopped publishing at `8.6.14` (confirmed via `bun pm view`) — Storybook 9/10 merged those addons into core, so there is nothing left to install for baseline controls/actions/viewport. `@storybook/addon-docs` (autodocs) is left for a follow-on if docs pages are wanted; it isn't needed for isolated viewing.
- Rationale for `apps/web`-scoped rather than root: Storybook renders real `apps/web` components against the real package DAG, the same way the app itself does — it's a consumer of `apps/web`, not an agent-workflow CLI like `openspec`/`modern-web-guidance` (root-pinned per `AGENTS.md`'s "Agent Tooling Packages" section, which is explicitly about tools that stay out of the import graph). `eslint-plugin-storybook` stays at root because `eslint.config.ts` is a single root-level flat config.

### 2. Config location and theming bridge

New `apps/web/.storybook/main.ts` and `apps/web/.storybook/preview.tsx`:

- `main.ts`: `framework: "@storybook/react-vite"`, `stories: ["../src/ui/**/*.stories.tsx"]`, `core: { disableTelemetry: true }` (avoids a network call on every CI build). No custom `viteFinal` needed — implemented and confirmed: `@storybook/react-vite` reads `apps/web/vite.config.ts` for the existing plugins/aliases/Tailwind setup by default, so the DAG aliases and `@tailwindcss/vite` plugin apply identically to Storybook and the real app (`build-storybook` succeeds with zero story files present).
- `preview.tsx`: imports `../src/index.css` (loads Tailwind + fonts + tokens). Implemented as: provide `ThemeContext.Provider` directly (not the full `ThemeProvider` component) with a value derived from Storybook's `theme` global, so `useTheme()`-consuming components (e.g. `ThemeToggle`) get a valid context without inheriting `ThemeProvider`'s own independent `localStorage`/`prefers-color-scheme` effect, which would otherwise race the toolbar-driven override described below.
- Storybook has no built-in dark-mode toggle (its core `backgrounds` feature only swaps canvas background-color swatches); implemented as a custom `globalTypes.theme` entry in `preview.tsx` plus a decorator that reads `context.globals.theme` and toggles the `dark`/`light` class on the Storybook preview iframe's own `<html>` — exercising the same `.dark`-class mechanism `ThemeProvider` uses at runtime, just driven by the toolbar selection instead of `ThemeProvider`'s own read path (see Risks below).

### 3. Story location and initial slice

Stories are colocated with their component (`Component.stories.tsx` next to `Component.tsx`), matching the existing `Component.test.tsx` colocation convention already used throughout `src/ui/`.

Initial slice (checked via `rg -l "@storagemaxxing/store"` across `src/ui/`):

- `ui/theme/ThemeToggle.tsx`
- `ui/options/StrategyCard.tsx` — **caveat**: this file does match the grep. It imports `LayoutResolution`/`ComparableStorageSystem` from `@storagemaxxing/store/layoutSelectors`, but only as type annotations (props, a `Record` key type) — neither name is ever used as a value in the file, and the import is not marked `import type`. Verified by reading the full file: no call into the store, no hook, no value usage of either import. Vite/Storybook both transpile via esbuild, which elides import specifiers that are only ever referenced in type position on a per-file basis (no cross-file type info needed), so the actual `@storagemaxxing/store` module is not pulled into the bundle or evaluated at runtime for this component. As a small implementation cleanup (not a design change), convert this to an explicit `import type { LayoutResolution, ComparableStorageSystem } from "@storagemaxxing/store/layoutSelectors"` when writing the story — it makes the type-only intent explicit instead of relying on esbuild's elision heuristic, and removes any ambiguity for a future reader.
- `ui/bom/BOMRow.tsx`, `ui/bom/BOMHeader.tsx`, `ui/bom/BOMSummary.tsx` — none of these match the grep; `BOMRow.tsx`/`BOMHeader.tsx` do import `@storagemaxxing/catalog/*` and `@storagemaxxing/assembly/*` (see Adversarial Audit failure mode below), just not the store.
- `ui/constraints/ConstraintRow.tsx`, `ui/constraints/ConstraintInputs.tsx` — none of these match the grep.

Each story supplies fixture props/args directly (no store, no router, no network) — proving the actual value proposition (isolation) rather than reimplementing app wiring inside Storybook.

### 4. Lint and typecheck scope

- `eslint.config.ts`: add a `files: ["apps/web/src/**/*.stories.tsx"]` block applying `eslint-plugin-storybook`'s recommended rules, additive to (not replacing) the existing `**/*.{ts,tsx}` rules already applied there — story files stay inside the strict/functional ruleset, they just gain Storybook-specific checks on top.
- `apps/web/.storybook/**` is added to the root `eslint.config.ts` `ignores` array alongside the existing `apps/web/e2e/**`/`apps/web/scripts/**`/`apps/web/playwright.config.ts` entries — config files, not application source. `apps/web/storybook-static/**` (the `build-storybook` output directory, also gitignored) needs the same treatment: missing it caused `bun run lint` to fail against a generated, minified bundle the first time `build-storybook` had been run locally before `bun run lint` — `.gitignore` entries are not automatically respected by ESLint's flat config.
- `apps/web/tsconfig.json` `include` gains `".storybook"` so `bun run typecheck` parses it (per `AGENTS.md`'s tsconfig-scope rule); `*.stories.tsx` files are already covered by the existing `"src"` include entry since they're colocated under `src/ui/`.

### 5. CI

Add `bun run --filter @storagemaxxing/web build-storybook` as a step in `.github/workflows/ci.yml`'s existing `verify` job (after `Test`, alongside the existing `bun run lint`/`typecheck`/`test` steps) — not a new job, since it's a fast static build, not a browser-driven suite like the `e2e` job.

## Data Flow

```
apps/web (real app)                      apps/web (Storybook)
--------------------                     ---------------------
index.tsx                                .storybook/preview.tsx
  |                                        |
  v                                        v
<ThemeProvider>                          global decorator
  reads localStorage +                     wraps every story in
  prefers-color-scheme  ---.               <ThemeProvider> (same
  |                        |                component, same class
  v                        |                toggle) -- OR fixed
<App/> (store-connected)   |                light/dark via toolbar
  |                        |               |
  v                        v               v
@storagemaxxing/store  index.css        Story.tsx
  (Zustand + IndexedDB)  (Tailwind        args/props (fixtures,
  |                       tokens,          no store)
  v                       .dark            |
  Component               overrides)       v
  (props from store) ------.               Component (same source
  |                        |               file, identical props
  v                        v               shape)
  DOM (real data)        DOM (rendered     |
                          via shared        v
                          .dark class     DOM (isolated, fixture
                          + tokens)       data, same visual tokens)
```

Both paths render the same component source file and the same `index.css` token set; the only divergence is where props come from (store vs. fixture args) and where the `.dark` class toggle originates (`ThemeProvider`'s real logic vs. Storybook's toolbar-driven decorator).

## Risks / Trade-offs

- **Peer-range fix is a version bump, not a no-op.** Pinning `storybook@10.5.2` (vs. the already-present but unused `10.3.6`) is a new direct dependency addition, not a pure fix — confirmed clean: `bun install --frozen-lockfile` resolved with no peer warnings and `bun run --filter @storagemaxxing/web build` (main app) succeeded unaffected, since `storybook` and `@storybook/react-vite` are new entries in the dependency graph even though they don't touch runtime app code.
- **`@storybook/react-vite` reading the real `vite.config.ts`** means any future change to that file (e.g. the `E2E_DRILL_FIXTURE` alias from the sibling `e2e-drill-fixture-seam` change, see `openspec/changes/e2e-drill-fixture-seam/design.md`) is picked up by Storybook too, since both share one config file. That's intended (single source of truth for aliases), but a future alias added there for e2e-only purposes will also apply inside Storybook unless it's already env-gated — the existing `e2e-drill-fixture-seam` design already gates its alias behind `process.env.E2E_DRILL_FIXTURE`, so it defaults off in Storybook the same way it defaults off in `bun run dev`.
- **`.dark` class scoping**: `ThemeProvider` toggles `.dark` on `document.documentElement` (the real page's `<html>`). Storybook renders each story inside an iframe with its own `document.documentElement` — the decorator must toggle the class on the _iframe's_ `<html>`, not the parent manager UI's. This is a standard Storybook theming pattern (toolbar `globalTypes` + a decorator reading `context.globals`), not a novel mechanism, but it's a real implementation detail to get right, not just importing `ThemeProvider` as-is and expecting it to work — `ThemeProvider`'s own `prefers-color-scheme`/`localStorage` read path is bypassed entirely in favor of the toolbar-driven override for deterministic story rendering.
- **CI cost**: `build-storybook` adds one more step to the `verify` job. It's a static build (no browser), so cost is closer to the existing `bun run build` than to the `e2e` job's Playwright run — acceptable, no separate job needed.
- **Scope creep pressure**: "Storybook is now installed" invites drive-by story additions beyond the initial slice during this change. The Non-Goals section and the bead's own P3-vs-this-P2 sibling work exist to push that to follow-on beads instead.

## Adversarial Audit

- **Claim needing verification, now verified**: "eslint-plugin-storybook's peer isn't satisfied by the currently-resolved storybook" — checked directly against `bun.lock` and `bun pm view`, not inferred from package names. See Decision 1.
- **Claim needing verification, found partially false on re-check**: an earlier draft of this design claimed no initial-slice component touches the store, checked via `rg -l "@storagemaxxing/store"`. Re-running that exact grep turns up `StrategyCard.tsx` — the claim as originally stated was wrong. Reading the file resolved it (type-only import, elided at build time; see Decision 3's caveat), but this is flagged here deliberately: a "confirmed via grep" claim in this same design was itself wrong on first pass, which is precisely the failure mode this rule exists to catch. Independent adversarial review (2026-07-25) re-ran the grep and caught this before human sign-off.
- **Failure mode**: if `@storybook/react-vite` does _not_ transparently pick up `apps/web/vite.config.ts`'s `resolve.alias` DAG entries (contra the assumption in Decision 2), story files importing `@storagemaxxing/catalog/*` (e.g. `BOMRow.tsx`, `BOMHeader.tsx`) would fail to resolve at Storybook-build time. Mitigation: this is directly observable the first time `build-storybook` runs against a story that imports a DAG package — treat a resolution failure there as a design gap requiring an explicit `viteFinal` override in `main.ts`, not a silent workaround.
- **Sync conflict check**: the only other in-flight OpenSpec change (`e2e-drill-fixture-seam`, `status: in-progress` per `openspec list --json`) touches `apps/web/vite.config.ts` (adding an env-gated alias + configurable port) and `playwright.config.ts`. Both changes edit `vite.config.ts` but in disjoint ways (one adds a conditional alias swap + port var, this one only _reads_ the file from Storybook's config, no edits to it) — no merge conflict expected, but whichever change lands second should diff `vite.config.ts` against its own design assumptions before merging.
- **No new domain objects**: this change adds no runtime data model, so no Zod schema is introduced or modified.
