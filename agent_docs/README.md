# Agent docs (`agent_docs`)

## Overview

Modular agent operational rules, Beads lifecycle guidelines, engineering rails, sandbox boundaries, product strategy, and Bun tooling patterns imported by root `AGENTS.md`.

## Interface

- `beads-workflow.md` — Defines `bd` issue tracking rules, priorities, Dolt sync (`bd dolt push`/`bd dolt pull`), dependency verification, and the hand-patched `Session Completion` branch-and-PR workflow.
- `engineering-rails.md` — Defines functional purity, immutability, strict TypeScript typing, `tsconfig.json` `include` scope, monorepo DAG topology, TDD workflow, and layer specialization.
- `multi-agent-sandbox.md` — Defines shared memory (`bd remember`), audit logging (`bd audit record`), actor identity, Jules delegation caps, `.jules/prompts/` patrols, and workspace jail boundaries.
- `operational-loop.md` — Supplements `.beads/PRIME.md` with bead ownership, `apps/web` screenshot baselines, one-bead-per-commit format, session meta-reflection, and the Bead Task Contract.
- `product-strategy.md` — Establishes horizontal breadth across modular 2D fitters ahead of complex 3D/CAD or global optimization depth.
- `tooling-patterns.md` — Mandates pinned root `devDependencies` for agent CLIs, forbids `[run] bun = true` in `bunfig.toml`, and documents `bun test`, `--cwd`, and `--filter` commands.

## Invariants

- Root `AGENTS.md` links and `@`-imports all six files in this directory.
- Root `GEMINI.md` imports `@AGENTS.md`, loading all six files transitively.
- `beads-workflow.md` carries the hand-patched `Session Completion` block (`BEGIN BEADS INTEGRATION v:1 profile:full hash:f65d5d33`) enforcing feature branches and pull requests instead of direct pushes to branch-protected `main` (`GH013`); do not overwrite it by running `bd setup <recipe>` blindly.
- Known minor drift exists in older guidance notes relative to current code: `engineering-rails.md` lists functional purity for `geometry`, `catalog`, and `packer` only (while `eslint.config.ts` enforces it on `packages/assembly/src/**/*.ts` too) and states Layer 2 has no package (while `packages/packer/src/` and `apps/web/src/workers/solverWorker.ts` now implement OR-Tools CP-SAT WASM); `beads-workflow.md` references an absent `docs/QUICKSTART.md`; `multi-agent-sandbox.md` cites `bd sync` instead of Dolt sync; and `tooling-patterns.md` states packages have no `test` script while `packages/packer/package.json` defines `"test": "bun test"`.

## Side effects

- None; static Markdown guidance loaded into agent context.

## Verification

- Run: `bun run format:check`
