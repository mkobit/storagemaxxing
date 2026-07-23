# Web App | Agent Guide

This file extends the root `AGENTS.md` with `apps/web`-specific conventions.

## 👁 Visual inspection

Before and after any UI change, capture the current state so you can see what you're building against.

**Prerequisites (one-time setup):**

```bash
bun run --filter @storagemaxxing/web playwright:install
```

**Capture a screenshot:**

```bash
bun run screenshot                            # captures http://localhost:5173/
bun run screenshot -- /canvas                 # captures a specific route
bun run screenshot -- --recipe=options-mode   # drives app state to a named UI, then captures
```

Output: `.screenshots/latest.png` at workspace root.
Read this file to verify visual state — it shows exactly what the UI looks like.

**Recipes:** a recipe drives the app to a specific UI state (e.g. a component reachable only after creating a space and adding a bin) before capturing, so a single-component visual check doesn't require hand-writing a one-off Playwright script.
Recipes live in `scripts/screenshot-recipes.ts`; run with an unknown `--recipe=` name to print the current list.
Add a new recipe there — not a fresh throwaway script — when a future check needs to reach a state not already covered.

**Rules:**

- The dev server MUST be running first (`bun run dev`). Always start a **fresh** server — do not reattach to a stale session, as a stale Vite optimization cache causes React to fail to load entirely (empty page, 504 errors).
- Always take a screenshot before starting UI work (baseline) and after (verify).
- `.screenshots/` is gitignored — these are ephemeral dev-time files.
- Timestamped copies are also saved for session history.
- Use `bun run screenshot` / `bun run test:e2e` (this project's own `@playwright/test` + bun setup) for in-browser verification. Reach for a generic testing skill's own scripting pattern only if this project's tooling can't do the job — a generic skill's Python-based Playwright path isn't installed here and won't run.
- `LayoutCanvas`'s `<canvas>` scales with the active space template (`template.w`/`l` × `PIXELS_PER_INCH = 24`) and can be taller than a default browser viewport (~1280×720, with the toolbar/header above it), so a plain `page.screenshot()` without `fullPage: true` — or any default-viewport screenshot from a generic tool — can silently crop the bottom of the canvas out of the image, making correctly-rendered content look missing. `bun run screenshot` already passes `fullPage: true` and isn't affected; for anything else, either match that or inspect pixel data directly instead of trusting a cropped screenshot. A third option for ad hoc Playwright checks: `page.locator("canvas").screenshot()` (an element screenshot) captures exactly the canvas's own bounds regardless of page scroll or viewport size, sidestepping the crop problem entirely instead of requiring `fullPage: true` or a taller viewport.

## Scripts

- `bun run dev` — start Vite dev server on port 5173
- `bun run build` — production build to `dist/`
- `bun run test` — bun test unit tests (happy-dom)
- `bun run test:e2e` — Playwright end-to-end tests (requires dev server)
- `bun run screenshot [route] [--recipe=<name>]` — capture UI screenshot to `.screenshots/latest.png`, optionally driving to a named app state first (see `scripts/screenshot-recipes.ts`)
- `bun run typecheck` — TypeScript type check

## Architecture

- Entry: `src/index.tsx`
- App shell: `src/ui/App.tsx`
- Store: `@storagemaxxing/store` (Zustand + IndexedDB persistence)
- Styling: Tailwind CSS v4
- The app shows `Loading...` until the Zustand store finishes hydrating from IndexedDB — this is expected.
