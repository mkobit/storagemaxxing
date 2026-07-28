## Why

CI currently runs six checks (lint, typecheck, test, build-storybook, e2e, check-stories) across two jobs (`verify`, `e2e`).
Four of those six run as sequential steps inside the single `verify` job, so their wall-clock cost stacks even though lint, typecheck, and test have no dependency on each other.
Neither job caches bun's install/download cache or the Playwright browser download, so every run re-downloads dependencies and browsers from scratch.
As more checks accumulate (sm-t275 already added `check-stories` into the `e2e` job), total pipeline time will keep growing unless work is parallelized and cached.
This is bead sm-vd2g (P3 epic, discovered from sm-j2lx), which requires an OpenSpec design before any implementation bead is filed.

## What Changes

- Split the `verify` job's sequential steps (lint, typecheck, test, build-storybook) into independent parallel jobs so GitHub Actions schedules them concurrently instead of one after another.
- Add caching for bun's install/download cache and the Playwright browser download, keyed on lockfile/version so unchanged dependency trees skip re-download.
- Investigate path-based/affected-package skip-if-unchanged for the monorepo's five packages plus `apps/web`, and record the investigation's outcome (adopt now, defer, or reject) even if no job-skipping logic ships in this change.
- Audit reproducibility: confirm `bun install --frozen-lockfile` is used everywhere it should be, and check that every `uses:` action reference in `.github/workflows/ci.yml` is pinned to a commit SHA rather than a mutable tag.
- No product-facing behavior changes; this is CI/infra only.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `automated-verification`: adds requirements for CI job parallelization, dependency/tool caching, and pinned-input reproducibility, so pipeline execution characteristics are covered by spec, not just implied by AGENTS.md prose.

## Impact

- Affected packages in the DAG: none directly (`geometry`, `catalog`, `assembly`, `packer`, `store`, `web` source is untouched).
- Affected files: `.github/workflows/ci.yml` only.
- No new dependencies expected for parallelization/caching (uses `actions/cache` and GitHub Actions' native job-level `needs:`/matrix support).
- Skip-if-unchanged, if adopted, would need a path-filtering mechanism (e.g. `dorny/paths-filter` or an inline path comparison) — introduces one new pinned action if adopted; otherwise no new action.

## Success Criteria

- `.github/workflows/ci.yml` runs lint, typecheck, test, and build-storybook as independent jobs that execute concurrently rather than as sequential steps in one job, without changing what each check validates.
- A CI run with a warm cache measurably skips bun's dependency download and Playwright's browser download (visible in the Actions log as a cache hit).
- The reproducibility audit is recorded (which action refs are SHA-pinned vs not, and any gaps fixed) and `bun install --frozen-lockfile` usage is confirmed everywhere dependencies are installed in CI.
- The skip-if-unchanged investigation concludes with an explicit adopt/defer/reject decision recorded in this change's design, not left implicit.
- Child task beads are filed for every concrete change identified above, each satisfying the repo's Bead task contract (single `scope:`, spec reference, runnable acceptance criterion).
