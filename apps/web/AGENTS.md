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
bun run screenshot              # captures http://localhost:5173/
bun run screenshot -- /canvas   # captures a specific route
```

Output: `.screenshots/latest.png` at workspace root.
Read this file to verify visual state — it shows exactly what the UI looks like.

**Rules:**

- The dev server MUST be running first (`bun run dev`). Always start a **fresh** server — do not reattach to a stale session, as a stale Vite optimization cache causes React to fail to load entirely (empty page, 504 errors).
- Always take a screenshot before starting UI work (baseline) and after (verify).
- `.screenshots/` is gitignored — these are ephemeral dev-time files.
- Timestamped copies are also saved for session history.
- Use `bun run screenshot` / `bun run test:e2e` (this project's own `@playwright/test` + bun setup) for in-browser verification. Reach for a generic testing skill's own scripting pattern only if this project's tooling can't do the job — a generic skill's Python-based Playwright path isn't installed here and won't run.

## Scripts

- `bun run dev` — start Vite dev server on port 5173
- `bun run build` — production build to `dist/`
- `bun run test` — bun test unit tests (happy-dom)
- `bun run test:e2e` — Playwright end-to-end tests (requires dev server)
- `bun run screenshot [route]` — capture UI screenshot to `.screenshots/latest.png`
- `bun run typecheck` — TypeScript type check

## Architecture

- Entry: `src/index.tsx`
- App shell: `src/ui/App.tsx`
- Store: `@storagemaxxing/store` (Zustand + IndexedDB persistence)
- Styling: Tailwind CSS v4
- The app shows `Loading...` until the Zustand store finishes hydrating from IndexedDB — this is expected.
