# Agent Tooling & High-Velocity Bun Patterns

## Agent Tooling Packages

Skill-support CLIs that agents invoke via `bunx` (e.g. `openspec`, `modern-web-guidance`) are pinned as root `devDependencies`, not left as ephemeral/unpinned `bunx` fetches.
Pinning gives every agent the same resolved version and lets `bunx <tool>` resolve from `node_modules/.bin` instead of re-fetching from the registry each call.
These packages support agent workflow only — they are not application dependencies of `apps/web` or any `packages/*`, so they stay out of the monorepo's import graph and lint topology.
Add new agent-only tooling the same way: `bun add -d <package>` at the repo root.

## High-Velocity Bun Patterns

- **Runtime caveat:** Do NOT set `[run] bun = true` in `bunfig.toml`.
  It shims `node` to Bun inside `bun run` scripts, and Playwright's runner spawns `node` workers that are not supported under the Bun runtime.
- **Unit tests run on `bun test` everywhere:** packages directly, and `apps/web` with a happy-dom preload (`apps/web/bunfig.toml`).
- **Package tests:** Run package tests with `bun test packages/<pkg>` from the repo root.
  Packages have no `test` script, so `bun --cwd packages/<pkg> test` fails with "Script not found".
- **Root-Level Execution:** To run a script in a subproject from the root, use the `--cwd` flag.
  When using `run` with `--cwd`, place `--cwd` _after_ the `run` keyword to avoid CLI argument parsing errors (e.g. `bun run --cwd apps/web test:e2e`).
  Otherwise, run the script directly without `run` (e.g. `bun --cwd apps/web dev`).
- **Filter-based:** Alternatively, use `--filter` for workspace-aware execution:
  ```bash
  bun run --filter @storagemaxxing/web dev
  ```
