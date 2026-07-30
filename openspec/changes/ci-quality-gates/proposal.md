## Why

A prior manual audit pass (three parallel agent audits: dead code/lint, coverage, CI/infra) found real issues by reading code by hand: dead barrels and orphaned files (sm-bg72, sm-ut5o, sm-48ft, sm-528q, sm-9hnl), coverage gaps in live code (sm-wghm, sm-ygso, sm-uqsr), and lint/config hygiene problems (sm-sl7z, sm-jrur, sm-3u1c, sm-c4cg, sm-lotm, sm-pxhf).
All of that work is closed, but none of the finding categories is CI-enforced — confirmed by reading `.github/workflows/ci.yml`: it runs `lint`, `typecheck`, `test`, `build-storybook`, and `e2e` as independent jobs (post sm-nrbu), `test` passes `--coverage` for visibility only (sm-wghm, deliberately with no threshold), and there is no dead-code step at all.
The same classes of issue can silently reaccumulate.

Concrete, currently-live proof of that reaccumulation risk, found during this scoping pass: `tsconfig.json`'s `paths` entries for `@storagemaxxing/assembly`, `@storagemaxxing/catalog`, and `@storagemaxxing/geometry` still point at `src/index.ts` files that sm-bg72/sm-ut5o/sm-48ft deleted as dead barrels.
This is the identical dangling-alias bug class sm-pxhf fixed for `packer`/`store` in the very same audit pass — it recurred within the same session because nothing catches it.
Filed as sm-620t, discovered-from this epic.

sm-rs0c's own sequencing blockers (sm-nrbu: CI job split; sm-wghm: coverage visibility in CI) are both closed, so this design can target the current job topology instead of a moving target.

## What Changes

- Adopt **knip** as the dead-code / unused-export / unused-dependency detector (chosen over ts-prune and depcheck after running all three against this repo — see `design.md` Decision 1 for the comparative evidence), wired as a new step inside the existing `lint` CI job, not a new job, with a repo-tuned `knip.json` that accounts for this repo's dynamic Vite aliasing, Claude Code hook entry points, and the agent-only tooling packages AGENTS.md already carves out of the import graph.
- Add Bun-native coverage thresholds via `bunfig.toml`'s `[test] coverageThreshold` (root `bunfig.toml` for the `packages`+`.agents/hooks` run, `apps/web/bunfig.toml` for the web run), set from the real baseline measured in this design, plus `coveragePathIgnorePatterns` excluding test-helper-only modules from the gate.
- Adopt `@eslint-community/eslint-plugin-eslint-comments`'s `no-unlimited-disable` and `require-description` rules so the sm-3u1c file-wide-`eslint-disable` pattern is permanently caught by lint. Do **not** add a bespoke rule for sm-lotm's unused-elsewhere-exported-type pattern — knip's unused-export detection (previous bullet) already fully subsumes it.
- Roll out all three gates **advisory-first** (non-blocking in CI) for an initial period, then flip each to blocking independently once its false-positive/pre-existing-finding backlog is triaged to zero or an explicit allowlist — see `design.md` Decision 4 for the concrete flip trigger per gate.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `automated-verification`: adds requirements for a dead-code detection gate, a per-invocation coverage threshold gate, and eslint-comment disable hygiene enforcement, following the same capability this epic's blockers (sm-nrbu / `ci-pipeline-performance`) already extended for CI job topology and caching.

## Impact

- Affected packages in the DAG: none directly — `geometry`, `catalog`, `assembly`, `packer`, `store`, `web` source is untouched by this change itself; the gates apply *across* all of them.
- Affected files: `.github/workflows/ci.yml` (new step in the `lint` job), `package.json` (two new devDependencies, one new `knip` script), new `knip.json`, `bunfig.toml` and `apps/web/bunfig.toml` (coverage threshold config), `eslint.config.ts` (new plugin + two rules).
- New dependencies: `knip`, `@eslint-community/eslint-plugin-eslint-comments` — both devDependencies only, no runtime/application impact.
- Follow-up work discovered during scoping, not part of this change's implementation: sm-620t (dangling tsconfig.json aliases), and triaging the real `@storagemaxxing/packer` unused-dependency finding in `apps/web/package.json` / `packages/assembly/package.json` that knip and depcheck both independently confirmed (see `design.md` Decision 1).

## Success Criteria

- `design.md` names a specific dead-code tool, backed by comparative evidence from actually running knip, ts-prune, and depcheck against this repo (not a paper comparison).
- `design.md` names a specific, verified-working coverage threshold mechanism (CLI flag vs `bunfig.toml` config resolved by direct testing, not assumption) with concrete threshold numbers derived from real measured baselines for both CI test invocations.
- `design.md` states, per lint-hygiene finding (sm-3u1c, sm-lotm), whether it becomes a permanent automated rule or not, with reasoning.
- `design.md` records an explicit blocking-vs-advisory-first rollout decision, with a concrete per-gate trigger for flipping to blocking, not left implicit.
- Child implementation task beads are filed only after the hole-poking (independent-subagent adversarial review) and human-review steps of this change's `feature-probe` formula complete — this proposal and `design.md` alone satisfy sm-rs0c's "design.md exists" acceptance criterion; the "child task beads filed" half of that criterion is satisfied later in the same formula, not by this artifact.
