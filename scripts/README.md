# Scripts

## Overview

Repository maintenance, verification, and sandbox setup CLI scripts executed with Bun.
Each script enforces repository configuration parity, coverage thresholds, or isolated Beads context initialization.

## Interface

- `[check-coverage-threshold.ts:export {}]` — Empty module export; no exported functions or types.
- `[check-coverage-threshold.ts:main]` — CLI entrypoint invoked via `process.exit(await main())`; runs `INVOCATIONS` in parallel and exits `0` if all per-file thresholds pass or `1` if any file misses or coverage output cannot be parsed.
- `[check-coverage-threshold.ts:INVOCATIONS]` — Configures two `bun test --coverage` targets: `packages + hooks` (`bun test packages ./.agents/hooks --coverage`, threshold `{ functions: 0.85, lines: 0.9 }`) and `apps/web` (`bun --cwd apps/web test src --coverage`, threshold `{ functions: 0.8, lines: 0.85 }`).
- `[check-gitignore-eslint-parity.ts:top-level]` — CLI entrypoint; checks `.gitignore` directory entries against `eslint.config.ts` global ignores and exits `1` if any are unpaired.
- `[check-sbx-env.ts:top-level]` — CLI entrypoint; runs `checkKitSpec`, `checkFile`, `checkToolchainParity`, and `checkKitWithSbx`, exiting `1` if any returns `false`.
- `[check-sbx-env.ts:checkKitSpec]` — Validates `.sbx/kit/spec.yaml` structure (`name`, `schemaVersion`).
- `[check-sbx-env.ts:checkFile]` — Validates `.sbx/sbxenv.yaml`, `.sbx/sbxenv.agy.yaml`, and `.sbx/sbxenv.claude.yaml`.
- `[check-sbx-env.ts:checkToolchainParity]` — Validates toolchain and Playwright parity across `mise.toml`, `package.json`, `.sbx/kit/spec.yaml`, and `apps/web/package.json`.
- `[check-sbx-env.ts:checkKitWithSbx]` — Runs `sbx kit validate .sbx/kit --offline` when `sbx` is available on `PATH` (warns and returns `true` if `sbx` is absent).
- `[setup-sbx-context.ts:top-level]` — CLI entrypoint; initializes an isolated `.sbx-task/beads-context-*` directory from `.sbx-task/issues.jsonl` and writes `.sbx-task/beads-context.env`.

## Invariants

- `[check-coverage-threshold.ts:main]` — Every non-`All files` file row in each invocation must satisfy `functions >= threshold.functions` and `lines >= threshold.lines`; an empty parsed row list is treated as a miss.
- `[check-gitignore-eslint-parity.ts:top-level]` — Every directory-shaped `.gitignore` line (`/^([^#\s][^\n]*)\/$/`) must have its final path segment matched inside a string literal in the first `tseslint.config({ ignores: [...] })` block of `eslint.config.ts`.
- `[check-sbx-env.ts:checkKitSpec]` — `.sbx/kit/spec.yaml` must exist, parse as a YAML object, have a non-empty string `name`, and have `schemaVersion` equal to `2` or `"2"`.
- `[check-sbx-env.ts:FORBIDDEN_KEYS]` — `.sbx/sbxenv.yaml`, `.sbx/sbxenv.agy.yaml`, and `.sbx/sbxenv.claude.yaml` must not contain `secrets`, `bindings`, `registries`, `localWorkspaces`, or `ports`, must set `workspace.clone: false`, and must include `"./kit"` in `kits`.
- `[check-sbx-env.ts:checkToolchainParity]` — `mise.toml` `tools.bun` must equal `package.json` `packageManager` (without `bun@`) and `engines.bun`; `mise.toml` must define `tools["github:gastownhall/beads"]`; `.sbx/kit/spec.yaml` `setup.install` must run `mise install`, must not run `mise use` or `bun@<digit>`/`beads@<digit>`, and must include `bun run --cwd apps/web playwright install chromium`; `apps/web/package.json` must define `devDependencies["@playwright/test"]`; and `.sbx/kit/spec.yaml` `permissions.network.allow` must include `cdn.playwright.dev`, `playwright.download.prss.microsoft.com`, and `storage.googleapis.com`.
- `[setup-sbx-context.ts:snapshot]` — `.sbx-task/issues.jsonl` must exist and be non-empty; ambient `BEADS_*` and `BD_*` environment variables are stripped before invoking `bd --sandbox` without `-C` so `BEADS_DIR` is not overridden.

## Side effects

- `[check-coverage-threshold.ts:runInvocation]` — Spawns `bun test` subprocesses for `packages ./.agents/hooks` and `apps/web` (`src`), logs results to stdout, and terminates with `process.exit`.
- `[check-gitignore-eslint-parity.ts:top-level]` — Reads `.gitignore` and `eslint.config.ts`, writes report output to stdout, and calls `process.exit(1)` on unpaired entries.
- `[check-sbx-env.ts:checkKitWithSbx]` — Reads `.sbx/` files, `mise.toml`, `package.json`, and `apps/web/package.json`; executes `command -v sbx` and `sbx kit validate .sbx/kit --offline` via `execSync`; writes to stdout and stderr; and calls `process.exit(1)` on failure.
- `[setup-sbx-context.ts:top-level]` — Reads `.sbx-task/issues.jsonl`; creates `.sbx-task/`, `.sbx-task/beads-context-*`, and `.beads/` (`0o700`); writes `.beads/config.yaml`, `issues.jsonl`, `snapshot.json`, and `context.env`; spawns `bd --sandbox init` and `bd --sandbox import`; atomically renames `context.env` to `.sbx-task/beads-context.env`; and logs to stdout.

## Verification

- Run: `bun run check:sbx-env`
- Run: `bun test`
