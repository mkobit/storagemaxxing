## Why

Agents (Claude, Gemini/Antigravity, Jules, Opencode) currently have no way to visually inspect the UI while developing.
Without visual grounding, agents drift — they change code without seeing what they're building against.
The UI is in a good baseline state and forward progress is stalling because agents cannot verify their own UI changes.
A zero-friction screenshot primitive gives every agent "eyes" to see the current state before and after changes.

## What Changes

A `bun run screenshot` command is added to `apps/web/package.json` that any agent can call from the shell.
A small Playwright script captures a full-page screenshot of the running dev server and saves it to a predictable path.
The root `package.json` gains a delegating script so agents can run it from the workspace root.
`AGENTS.md` is updated to document the screenshot convention as a first-class development primitive.
`.screenshots/` is added to `.gitignore` so captured images don't pollute the repository.

## Capabilities

### New Capabilities

- `agent-screenshot`: Shell-accessible screenshot capture for agents to visually inspect the running web UI

### Modified Capabilities

- `agent-rails`: AGENTS.md gains a visual inspection section documenting the screenshot convention for all agents

## Impact

- **Affected layer**: Web UI only (`apps/web`). No `packages/` code is touched.
- **New file**: `apps/web/scripts/screenshot.ts` — Playwright script, ~15 lines.
- **Modified files**: `apps/web/package.json`, root `package.json`, `AGENTS.md`, `.gitignore`.
- **No solver, packer, geometry, or catalog changes.**

## Success Criteria

- `bun run screenshot` from the workspace root saves `.screenshots/latest.png` when the dev server is running.
- `bun run screenshot -- /canvas` captures a specific route.
- Any agent that can run bash and read image files can use this without additional setup.
- `AGENTS.md` documents the command so all agents discover it without per-agent configuration.
