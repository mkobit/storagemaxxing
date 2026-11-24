# Agent Tooling & High-Velocity Bun Patterns

## Agent Tooling Packages

Skill-support CLIs that agents invoke via `bunx` (e.g. `modern-web-guidance`) are pinned as root `devDependencies`, not left as ephemeral/unpinned `bunx` fetches.
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

## Background dev-server probes

Never launch a dev server or background server (`vite`, `storybook`, `bun run dev`, etc.) without a hard wall-clock timeout and process-group cleanup.
Unbounded `Bun.spawn` calls or background shells can stall indefinitely when child processes hold ports or stdio pipes open.

- **Shell probes:** Wrap every server probe or long-running check with `timeout -k 5 <sec>s <cmd>`.
  ```bash
  timeout -k 5 60s bunx storybook dev --port 6006 --ci
  ```
- **Bun probes:** Spawn with `detached: true` (creates a new process group), pass `signal: AbortSignal.timeout(<ms>)`, and kill the entire process group (`-proc.pid`) in `finally`.
  ```ts
  const proc = Bun.spawn(
    ["bunx", "storybook", "dev", "--port", "6006", "--ci"],
    {
      detached: true,
      signal: AbortSignal.timeout(60_000),
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  try {
    // Poll readiness or read output within the timeout
  } finally {
    try {
      process.kill(-proc.pid, "SIGKILL");
    } catch {
      // Process group already exited
    }
    await proc.exited;
  }
  ```
