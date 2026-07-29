## Context

Current `.github/workflows/ci.yml` has two top-level jobs with no `needs:` between them, so they already run concurrently:

```
push/PR
  ├─ verify (checkout → mise → bun install → lint → typecheck → test → build-storybook)
  └─ e2e    (checkout → mise → bun install → playwright:install → test:e2e → check-stories)
```

Measured timings from four recent successful runs (`gh run view --json jobs`, runs 30298111607, 30298088931, 30298051384, 30297963180) show `verify`'s steps are NOT evenly weighted:

```
checkout:  ~1s
mise:      ~2s
install:   ~1s
lint:      29-47s   <-- dominant cost, consistently ~80% of the job
typecheck:  4-5s
test:       1-2s
storybook:  2-3s
```

`verify`'s total wall time is ~50-60s per run; `e2e` (Playwright browser install + golden-path test + `check-stories`) runs ~90-110s and is the longer of the two jobs, so it — not `verify` — is the pipeline's actual critical path.

`check-stories` (`apps/web/scripts/check-stories.ts:93-94`) spawns its own `bunx storybook dev` server; it does NOT consume `build-storybook`'s output, confirmed by reading the script. This means `build-storybook` and the `e2e` job's Storybook usage are fully independent — safe to parallelize without a `needs:` edge.

Neither job caches bun's install/download cache (`~/.bun/install/cache`) or the Playwright browser download (`~/.cache/ms-playwright` or equivalent). `bun install --frozen-lockfile` is already used in both jobs (confirmed in ci.yml:16,41).

Action pinning is inconsistent: `.github/workflows/ci.yml:13,38` pins `actions/checkout@v7.0.0` (mutable tag), while `.github/workflows/beads.yml:15` and `.github/workflows/openspec.yml:14` pin the same action to a commit SHA (`@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0`). This is the one reproducibility gap in scope for this change; broader security posture (missing `permissions:` blocks, no CodeQL/dependency-review, no CODEOWNERS) was audited separately and is tracked as its own infra beads, not folded into this CI-performance change.

## Goals / Non-Goals

**Goals:**

- Parallelize `verify`'s independent steps (lint, typecheck, test, build-storybook) into separate jobs so a slow step (lint) doesn't block fast, independent ones (typecheck/test/build-storybook) — modest win given the measured split (see Risks below).
- Cache bun's install/download cache and the Playwright browser download, keyed on the lockfile hash, so unchanged dependency trees skip re-download.
- Investigate ESLint's own `--cache` support, since lint is the dominant cost (~80% of `verify`) and neither job-parallelization nor dependency-caching touches that cost at all.
- Decide, explicitly, whether path-based skip-if-unchanged is worth adopting now.
- Pin `actions/checkout` in `ci.yml` to the same commit SHA already used in `beads.yml`/`openspec.yml`.

**Non-Goals:**

- `permissions:` blocks, CodeQL, dependency-review-action, CODEOWNERS — real gaps, tracked as separate infra beads (see Risks/adjacent findings), out of scope for a change specifically about pipeline *performance* and the *reproducibility* bullet already named in sm-vd2g.
- Changing what any check validates — same lint ruleset, same tests, same e2e scenarios, same accessibility checks.
- Any change to `packages/*` or `apps/web` source. This change touches `.github/workflows/ci.yml` only.

## Decisions

### 1. Split `verify` into four independent jobs

`lint`, `typecheck`, `test`, `build-storybook` each become their own job (checkout → mise → bun install → single step), no `needs:` between them since none depends on another's output. `e2e` is untouched.

```
push/PR
  ├─ lint             (checkout → mise → bun install → lint)
  ├─ typecheck        (checkout → mise → bun install → typecheck)
  ├─ test             (checkout → mise → bun install → test)
  ├─ build-storybook  (checkout → mise → bun install → build-storybook)
  └─ e2e              (checkout → mise → bun install → playwright:install → test:e2e → check-stories)
```

Expected wall-time effect: `typecheck`/`test`/`build-storybook` (currently forced to wait behind `lint`) start immediately instead of after ~30-47s, so the *slowest of the four* becomes `lint` itself (~30-47s) plus its own ~4s setup, instead of the sum of all four (~50-60s). Estimated savings: roughly 10-15s per run — real, but modest, because setup (checkout+mise+install, ~4s) is now paid four times instead of once. GitHub Actions job-queue/runner-provisioning overhead (not visible in the timestamps above, since these ran without a queue wait) could partly offset this on a busier runner pool; note this as a risk, not a blocker.

### 2. Cache bun's install cache and the Playwright browser download

Add `actions/cache` (pinned to a commit SHA, matching the pinning fix in Decision 4) to every job that runs `bun install`, keyed on `bun.lock`'s hash plus the runner OS, restoring `~/.bun/install/cache`. Add a second cache for the Playwright browser binaries in the `e2e` job, keyed on the Playwright version (from `bun.lock` or `package.json`) plus runner OS, restoring the browser cache directory so `playwright:install` skips the download on a hit.

Given `bun install` already completes in ~1s uncached (small lockfile, likely already warm on GitHub's runner image or fast on Bun's resolver), the install-cache's main value is reliability/hermeticity under network flakiness, not raw speed — the Playwright browser cache is the one with real expected wall-time payoff, since browser binary downloads are typically tens of seconds and `e2e` is already the pipeline's longest job.

### 3. Investigate ESLint caching as the highest-ROI, currently-untracked option

Lint is ~80% of the (formerly single) `verify` job's cost and is untouched by parallelization or dependency caching. `bun run lint` runs `eslint . --max-warnings 0` with no `--cache` flag. ESLint supports `--cache --cache-location <path>`, which skips re-linting files unchanged since the last cached run. In CI, this requires caching the `.eslintcache` file itself (via `actions/cache`, keyed on a hash of `eslint.config.ts` plus a rolling key) across runs, since each run starts from a fresh checkout. This is a plausible high-value addition but is a *new* mechanism, not one hinted at in the original epic's bullets — filed as its own child task (see tasks.md) rather than assumed, since verifying that `--cache` invalidation is correct in this repo's flat ESLint config is real work, not a trivial flag flip.

### 4. Reproducibility: pin `actions/checkout` in `ci.yml` to the same SHA already used elsewhere

`ci.yml:13,38` change from `actions/checkout@v7.0.0` to `actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` (the exact SHA already in use in `beads.yml`/`openspec.yml`, confirmed by grep — same major version, so no behavior change expected). `bun install --frozen-lockfile` is already correctly used in both jobs; no change needed there.

### 5. Skip-if-unchanged: defer, do not implement in this change

Measured pipeline wall time is ~90-110s end-to-end (bounded by the `e2e` job, not `verify`), for a five-package-plus-one-app monorepo. Path-based skip-if-unchanged would need to account for the lint-enforced DAG (`geometry → catalog → assembly → packer → store → web`): a change to `packages/geometry` must still re-run checks for every downstream package, so the filter logic is "changed package OR any of its downstream dependents," not a flat per-directory filter — meaningfully more complex than a typical skip-if-unchanged setup, and would add a new pinned action (e.g. `dorny/paths-filter`) plus an ongoing maintenance cost of keeping the filter's dependency graph in sync with the DAG as packages are added. At ~90-110s total and five packages, this complexity is not justified today.

**Decision: defer.** Revisit if either (a) `bun test`/`e2e` wall time grows past roughly 5 minutes, or (b) a sixth+ package is added such that most PRs only touch one leaf package. Record this reasoning in the child task bead rather than silently dropping the epic's investigation bullet.

## Risks / Trade-offs

- **Job-count overhead**: splitting `verify` into four jobs pays GitHub Actions' per-job runner provisioning/queueing cost four times instead of once. On a lightly-loaded runner pool (as observed in the measured runs) this overhead is near-zero; under contention it could erode or reverse the parallelization win. Mitigation: none needed proactively — if this regresses, it's directly observable in Actions run duration and can be reverted per-job.
- **Cache staleness**: an `actions/cache` key that's too broad could serve a stale `.eslintcache` after a rule change that isn't reflected in the key. Mitigation: key on a hash of `eslint.config.ts` (and ideally the eslint/typescript-eslint devDependency versions from `bun.lock`), not just a static string, and treat a cache miss as the safe/correct fallback (full lint), never a failure.
- **Adjacent findings out of scope**: the same audit that surfaced the checkout-pinning gap also found no `permissions:` blocks in any workflow, no CodeQL/dependency-review/secret-scanning workflow, and no CODEOWNERS file. These are real gaps but are security-posture concerns, not pipeline-performance/reproducibility ones — tracked as separate beads so this change stays scoped to what sm-vd2g actually asked for.

## Adversarial Audit

- **Claim under test**: "parallelizing `verify` saves meaningful time." Verified against four real run timings, not assumed — the actual saving is ~10-15s, smaller than intuition suggests, because lint dominates and still gates the parallel group's completion. Documented honestly above rather than oversold.
- **Claim under test**: "`check-stories` needs `build-storybook`'s output." Checked by reading `apps/web/scripts/check-stories.ts:93-94` directly — it spawns its own `storybook dev` server, so this is false; the two are safe to run without ordering. Stated as verified, not inferred from job names.
- **Failure mode**: an `actions/cache` restore that silently serves a corrupted or incompatible Playwright browser cache (e.g. after a Playwright version bump without a corresponding cache-key bump) could make `e2e` fail in a confusing way (browser launch failure) rather than falling back cleanly to a fresh install. Mitigation: key the Playwright cache on the resolved Playwright version, not a static string, so a version bump naturally invalidates it.
- **Failure mode**: pinning `actions/checkout` to a SHA that later needs updating (e.g. a security patch) requires a manual bump across three workflow files instead of one `@v7` tag update. This is the accepted trade-off of SHA-pinning (already the repo's stated convention in two of three workflows) — not a new risk introduced by this change, just made consistent.
