## Context

Agents in this monorepo (Claude, Gemini/Antigravity, Jules, Opencode) cannot currently see the UI they are building.
Playwright 1.59.1 and Chromium (chromium-1217) are already installed in `apps/web`.
The dev server runs on `http://localhost:5173` via Vite.
WSL2 is the primary dev environment; headless Chromium requires no display server.

## Goals / Non-Goals

**Goals:**

- Single `bun run screenshot` command accessible from workspace root and `apps/web`.
- Output to `.screenshots/latest.png` at a predictable, stable path.
- Accept an optional route argument (default `/`).
- Work for any agent that can run bash and read image files.
- Document the convention in `AGENTS.md` as a first-class development primitive.

**Non-Goals:**

- CI screenshot capture (deferred to a 3P visual testing tool).
- Cross-resolution / viewport testing (deferred to 3P visual testing).
- Visual regression / baseline diffing.
- Auto-starting the dev server (agents manage process lifecycle themselves).
- Any changes to `packages/` — this is `apps/web` only.

## Decisions

**Script language: TypeScript via Bun**
The script is `apps/web/scripts/screenshot.ts`, run with `bun scripts/screenshot.ts`.
Consistent with the project's Bun-first approach; no additional runtime needed.

**Require dev server running**
The script connects to `http://localhost:5173` and fails fast if the server is not available.
Agents start the dev server as part of their normal workflow; auto-starting adds complexity and startup overhead.

**Output path: `.screenshots/latest.png` at workspace root**
A single stable path means all agents know exactly where to look without reading output.
The root location is accessible from any package or script.
A timestamped copy (`.screenshots/<iso-timestamp>.png`) is also saved for session history.

**Full-page desktop screenshot only**
1280×800 viewport, full page capture.
Viewport variants belong to the 3P visual testing story.

**No Zod schemas needed**
This change introduces no domain objects — it is pure tooling with no data model.

## Data flow

```
  Agent shell
      │
      ▼
  bun run screenshot [route]          ← root package.json delegates to apps/web
      │
      ▼
  apps/web/scripts/screenshot.ts
      │
      ├─── chromium.launch() (headless, no display server)
      │
      ├─── page.goto("http://localhost:5173<route>")
      │         │
      │         ▼
      │    Vite dev server (must be running)
      │         │
      │         ▼
      │    React app renders
      │
      ├─── page.screenshot({ fullPage: true })
      │
      ├─── write → .screenshots/latest.png
      └─── write → .screenshots/<timestamp>.png
      │
      ▼
  Agent reads .screenshots/latest.png  ← visual context for next action
```

## Risks / Trade-offs

**Dev server must be running**
If an agent forgets to start the server, the script exits with a clear error.
Mitigation: document the prerequisite explicitly in `AGENTS.md`.

**Stale screenshot**
An agent may read a screenshot taken before their most recent change.
Mitigation: agents should call `bun run screenshot` immediately before reading the file.

**WSL2 path resolution**
`.screenshots/` resolves relative to the workspace root when run from root, and relative to `apps/web` when run from that directory.
Mitigation: the root `package.json` script uses an absolute-equivalent `--cwd` approach; the script resolves its output path relative to the workspace root using `process.cwd()` or a fixed relative path from the script's location.

## Adversarial Audit

**Port collision**: Another process on 5173 could serve garbage.
The script does not validate the page — it screenshots whatever is there.
Acceptable for a dev-time tool; agents should verify the server is theirs before screenshotting.

**Playwright browser version drift**: `chromium-1217` is currently installed.
`bun install` does not re-install browsers; a new dev environment needs `bun run --cwd apps/web playwright:install`.
Mitigation: document setup step in `AGENTS.md`.

**Concurrent agents**: Two agents screenshotting simultaneously will overwrite `latest.png`.
The timestamped copy preserves history; `latest.png` is always the most recent.
This is acceptable for the dev-time use case.
