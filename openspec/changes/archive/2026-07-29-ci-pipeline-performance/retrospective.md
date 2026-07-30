# Retrospective: ci-pipeline-performance

## §0 Evidence

- **Commit Range**: `96174cc..978c404` (PRs #283-#289 on `main`)
- **Tasks Completed**: 1.1, 2.1, 2.2, 3.1, 4.1 (all `tasks.md` items; §5 skip-if-unchanged explicitly deferred, no implementation task filed)
- **Beads Closed**: sm-nrbu, sm-7nlm, sm-cdiy, sm-w3dt, sm-nj90 (epic children); plus two adjacent tasks surfaced and closed in the same session but tracked outside this change's `meta:openspec:` label: sm-jrte (workflow `permissions:` blocks) and sm-wghm (`bun test --coverage` wiring, discovered-from the separate `sm-rs0c` epic)
- **Test Status**: `bun test packages ./.agents/hooks --coverage` — 156 pass, 0 fail; `bun --cwd apps/web test src --coverage` — 68 pass, 0 fail. `bun run lint`, `bun run typecheck`, `bunx openspec validate --all` (17/17) and `bd lint` all clean as of `978c404`.

## §1 Wins

- All five `tasks.md` items shipped as five separate, independently-verified PRs (#284-#289 for jobs+SHA-pin, bun cache, Playwright cache, ESLint cache, permissions, coverage) rather than one large batch — each merged only after its own CI run went green, and each cache-hit claim was checked against real Actions logs, not assumed.
- The ESLint `--cache` spike (sm-cdiy) was explicitly de-risked _before_ touching CI: local experiments confirmed (a) a config-file edit forces a full cache invalidation and (b) a deliberately introduced violation on an already-cached file is still caught — directly answering the bead's stated risk ("a stale cache silently skipping a file that should fail lint would be worse than no caching").
- Measured, real speedups: full-repo lint ~80s cold → ~4-6s warm locally (~57s → ~18-25s in CI); Playwright browser install 22s cold → 14s warm.
- `bun test --coverage` visibility landed with zero new dependencies, using Bun's built-in coverage reporter.
- Two adjacent gaps found while reading the workflows for this change (missing `permissions:` blocks; no coverage visibility anywhere) were scoped as their own beads and closed in the same session rather than silently bundled into the caching PRs.

## §2 Misses

- The original epic bullets didn't anticipate that lint (not install or browser download) was ~80% of pipeline cost — that only surfaced from reading real CI job timings during design, and became its own child task (sm-cdiy) rather than being covered by the epic's original "caching" bullet.
- Skip-if-unchanged (tasks.md §5) was investigated and deferred per `design.md` Decision 5; no implementation task was filed, so this remains a known gap if the DAG grows a sixth+ package or e2e time crosses ~5 minutes.

## §3 Surprises

- **GitHub Actions cache scoping is per-branch, not per-repo.** A cache first saved during a PR's own CI run (branch `ci-w3dt-cache`, etc.) is invisible to the squash-merge's push-to-`main` run — different ref, different scope. This produced a "Cache not found" on both the Playwright cache's and the ESLint cache's _own_ merge-triggered runs, initially indistinguishable from a real bug. The acceptance criterion ("second run shows a hit") could only be confirmed on the _next_ push to `main`, which arrived for free as the following PR's merge in this same session.
- A bd-remember note written right after `sm-nj90` claimed the merge run itself reliably verifies a cache-hit criterion — that was **wrong in general**; it only worked for `sm-nj90` because `openspec.yml` had already independently warmed that exact bun-cache key on `main` well before this change existed. Corrected via `bd remember gh-actions-cache-branch-scoping`, with the original note marked `SUPERSEDED`.
- ESLint's default `--cache-strategy` (`metadata`, mtime+size) would have silently defeated caching in CI, since every fresh checkout resets file mtimes — required the explicit `--cache-strategy content` flag, easy to miss without testing the fresh-checkout interaction specifically.
- Extracting a resolved dependency version out of `bun.lock` for a cache key needs an anchored regex (`^\s*"<pkg>": \["<pkg>@\K[0-9.]+`), not a bare substring match — a naive pattern matches nested peer/override entries too (e.g. `"@types/eslint-plugin-jsx-a11y/eslint": ["eslint@9.39.4", ...]` sitting alongside the real top-level `"eslint": ["eslint@10.7.0", ...]`).

## §4 Promote

- [x] `gh-actions-cache-branch-scoping` bd memory — durable, repo-independent GitHub Actions fact, worth keeping as a standing memory beyond this change's archive.
- [x] Anchored `bun.lock` version-extraction regex pattern — reused twice already (Playwright, ESLint); worth reaching for again for any future per-dependency CI cache key.
- [ ] Revisit whether `sm-rs0c` (coverage/lint-hygiene-as-CI-gates epic) should add a coverage _threshold_ once enough CI runs accumulate a baseline from `sm-wghm`'s visibility-only wiring.
