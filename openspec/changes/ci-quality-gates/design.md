## Context

`.github/workflows/ci.yml` (post sm-nrbu) runs `lint`, `typecheck`, `test`, `build-storybook`, `e2e` as independent jobs. `test` passes `--coverage` on both invocations (sm-wghm) for visibility only — no threshold, no failure on regression. There is no dead-code step. `eslint.config.ts` already uses `eslint-plugin-import-x`'s `no-restricted-imports` to ban barrel imports (lines 33, 115) but has no rule constraining `eslint-disable` comment hygiene.

## Decision 1: Dead-code tool — knip, chosen from real comparative runs

All three candidates were run against this exact repo (not evaluated on paper):

**`bunx knip`** (zero-config): monorepo-package-aware — correctly attributed the unused `@storagemaxxing/packer` dependency to both `apps/web/package.json:26:6` and `packages/assembly/package.json:12:6` independently, i.e. it resolves each workspace package's own dependency graph rather than flattening the repo into one graph. Reported in structured sections: unused files (7), unused deps (2), unused devDeps (7), unused exports (35), unused exported types (24), duplicate exports (4). The "unused files" list includes `.agents/hooks/*.ts` (6 files) and `apps/web/e2e/fixtures/catalogWithDrillFixture.ts` — both false positives under zero-config, but for reasons knip's config surface directly targets: hooks are harness entry points, not import-graph nodes, and the e2e fixture is only reachable through a runtime-conditional Vite alias (`E2E_DRILL_FIXTURE=true` in `apps/web/vite.config.ts`). Both are exactly what knip's `entry`/`ignore` config exists to declare — see spec.md's "Known dynamic-resolution patterns" scenario.

**`bunx ts-prune`**: exports-only — no dependency-level detection at all (would miss the `@storagemaxxing/packer` finding entirely), no file-level dead-file detection, and noisier: every export used only within its own declaring module is still listed, tagged `(used in module)`, forcing a manual second read to distinguish genuinely-dead exports from merely-not-re-exported ones. No monorepo package-boundary awareness demonstrated in the output (flat list across all packages, unattributed to which package.json a finding belongs to).

**`bunx depcheck`**: dependency-only, and only against the *root* `package.json` by default — it did not surface the `packages/assembly`-scoped `@storagemaxxing/packer` finding knip caught, because it isn't workspace-aware out of the box. It also produced two clear false positives from its own limitations: flagged `bun:test` as a "missing dependency" (a Bun built-in, not an npm package) and flagged `@fission-ai/openspec`/`prettier-plugin-packagejson` as unused despite both being invoked via `bunx`/CLI rather than imported (the exact class of agent-tooling-only package AGENTS.md's "Agent Tooling Packages" section already carves out of the import graph deliberately).

**Verdict**: knip is the only one of the three that is both monorepo-package-aware and does full-spectrum detection (files + deps + exports + types) in one pass. It requires the most upfront config work (entry points for hooks, ignore pattern for the aliased e2e fixture, and marking `@fission-ai/openspec`/`prettier-plugin-packagejson`/`modern-web-guidance` as CLI-only per AGENTS.md's existing carve-out) but that cost is paid once, in `knip.json`, not per-PR. Wired as a new step inside the existing `lint` CI job (not a new job) — it's a static analysis check with the same trigger conditions as ESLint, and splitting it into its own job would add a redundant checkout/mise/install cycle for a step that runs in seconds.

## Decision 2: Coverage threshold — `bunfig.toml`'s `test.coverageThreshold`, verified real, baselines measured live

Confirmed against this repo's installed `bun-types` package (`node_modules/bun-types/docs/test/code-coverage.mdx`), not assumed: `[test] coverageThreshold` is a real, documented Bun config field, settable as a single number (applies to both `functions` and `lines`) or a table (`{ line = 0.7, function = 0.8 }`). `coveragePathIgnorePatterns` (also real, same doc) excludes matched files from the coverage calculation entirely — the right mechanism for `packages/geometry/src/testing.ts`, a test-factory module that imports `bun:test` and would otherwise drag its own partial internal coverage into the gate for unrelated product-code changes.

Measured baselines, run live via the exact CI commands:

| Invocation | Command | Measured % Funcs | Measured % Lines |
|---|---|---|---|
| packages + hooks | `bun test packages ./.agents/hooks --coverage` | 91.67 | 97.41 |
| apps/web | `bun --cwd apps/web test src --coverage` | 86.33 | 91.87 |

Proposed thresholds (small buffer below measured, to absorb normal test-count churn without being a tripwire on every PR):

- Root `bunfig.toml` (packages + hooks): `coverageThreshold = { line = 0.95, function = 0.90 }`
- `apps/web/bunfig.toml`: `coverageThreshold = { line = 0.90, function = 0.85 }`

Bun's own coverage report already breaks numbers down per-file (confirmed in the raw `bun test --coverage` output: e.g. `packages/geometry/src/Dimensions2D.ts` sits at 0% funcs / 58.33% lines today, dragged down by an apparently-untested branch), but `coverageThreshold` in `bunfig.toml` is a single value applied to the whole invocation, not configurable per-file or per-package within one invocation — this is a real Bun limitation, not a design choice. A genuinely per-package gate (e.g. `packages/geometry` at a stricter bar than `apps/web`) would require either separate `bun test` invocations per package with their own `bunfig.toml` (a bigger CI restructure, out of scope here) or waiting on a Bun feature that doesn't exist today. This design accepts the two-invocation granularity CI already has (post sm-nrbu) rather than restructuring further.

## Decision 3: Lint hygiene — `@eslint-community/eslint-plugin-eslint-comments`, not a bespoke rule

Package confirmed to exist on the registry (`bun info @eslint-community/eslint-plugin-eslint-comments` → real, latest `4.7.2`, MIT). Its `no-unlimited-disable` rule rejects a `/* eslint-disable <rule> */` with no matching `/* eslint-enable <rule> */` before end-of-file — this directly reproduces the sm-3u1c finding (`LayoutCanvas.tsx`'s file-wide disable, since fixed by hand) as an enforced rule. `require-description` rejects any `eslint-disable` comment lacking a `--` justification.

sm-lotm (unused-elsewhere-exported Props types in `apps/web/src/ui`) is **not** given a bespoke rule. It's a strict subset of what knip's "unused exports" / "unused exported types" detection (Decision 1) already covers — the ci-quality-gates change adding knip makes a second, narrower detector for the same finding class redundant. Verified directly: knip's live run above lists `CreateSpaceInput` (`apps/web/src/ui/spaceManager/CreateSpaceForm.ts`) and `WireframePolygon` (`apps/web/src/ui/wireframeScene.ts`) under "Unused exported types" — the same pattern class sm-lotm fixed elsewhere in the same tree, caught by the tool this design is already adopting.

Both new ESLint rules plug into the existing `eslint.config.ts` plugin-registration pattern already used for `eslint-plugin-import-x`, `eslint-plugin-functional`, etc. (top-of-file imports, `plugins: {}` block, per-scope rule entries) — no new mechanism, same file.

## Decision 4: Advisory-first rollout, per-gate flip trigger

All three gates ship non-blocking (visible in CI output, does not fail the job) initially, because the live runs above show each one has a non-trivial pre-existing backlog on this exact repo today:

- **Dead-code (knip)**: 7 unused files, 2 unused deps, 7 unused devDeps, 35 unused exports, 24 unused exported types, 4 duplicate exports, *before* `knip.json` config work even removes the false positives (hooks, e2e fixture). Flip trigger: after `knip.json` is written (entry points + ignores for the known-dynamic cases) and every remaining real finding is either fixed or added to an explicit `knip.json` ignore list with a reason, flip the CI step from advisory to blocking (non-zero exit fails the job).
- **Coverage threshold**: the two thresholds above are already set *below* today's measured baseline, so this gate can flip to blocking immediately once `coverageThreshold` is added to both `bunfig.toml` files and one CI run confirms it doesn't fail against current `main` — there's no backlog to triage, only a verification step.
- **Eslint-comments hygiene**: needs a repo-wide grep for existing `eslint-disable` comments lacking `eslint-enable` or a `--` reason first (not run as part of this design — deferred to the implementation bead, since it's a mechanical fix-up pass, not a design decision). Flip trigger: zero `no-unlimited-disable`/`require-description` violations on `main`.

Each gate's CI step reports its findings (dead-code list, coverage numbers, comment-hygiene violations) regardless of advisory/blocking state, so the backlog's shrinking is visible in every PR's CI output before the flip, not hidden until then.

## Risks / Trade-offs

- **knip false-positive maintenance burden**: `knip.json`'s entry/ignore list needs updating whenever a new Claude Code hook or Vite-aliased fixture is added — a config file that silently drifts out of date reintroduces exactly the "manual audit needed" problem this epic exists to solve. Not resolved by this design; flagged for the hole-poking pass to weigh whether a CI check on `knip.json` itself (e.g. "does every file under `.agents/hooks/` appear in `knip.json`'s entry list") is worth adding.
- **Coverage threshold granularity**: accepting invocation-level (not per-package) thresholds means a big coverage drop in one small, pure-functional package (e.g. `geometry`) could be offset by unrelated packages in the same invocation staying at 100%, without the gate catching it. Flagged, not solved — see Decision 2.
- **Bun's coverage numbers already show a real gap today**: `Dimensions2D.ts` and `Rect2D.ts` are at 0% function coverage right now (confirmed in the live run). The proposed thresholds are set to not fail on this pre-existing gap, which means the gate ships without actually closing it. That's a deliberate scope boundary (this design gates *regression*, not *today's baseline*) but worth flagging explicitly for the hole-poking pass.

### Adversarial audit (author's initial pass — NOT a substitute for the required independent hole-poking pass)

Per the `feature-probe` formula, a fresh-context subagent must run the `hole-poking` step against this file before implementation task beads are filed. Specific targets for that pass: (1) whether the advisory-first rollout risks becoming permanent (no automated check forces the flip-trigger conditions to actually get evaluated), (2) whether `knip.json`'s false-positive list for hooks/fixtures is complete or whether other dynamic-resolution patterns exist elsewhere in the repo that weren't checked, (3) boundary conditions (a PR that deletes the last file in a package, a coverage run with zero test files), and (4) whether the two coverage-threshold buffers chosen (95%/90% line, 90%/85% func) are tight enough to catch a real regression or loose enough to be a no-op gate in practice.

## Open Questions

- Should the dead-code step run on every PR or only on `main`-target PRs that touch source files (to avoid re-running a whole-repo scan on doc-only changes)? Leaning toward: every PR, since knip's runtime on this repo is a few seconds — not worth the conditional-execution complexity. Flag for hole-poking to confirm the runtime assumption holds in CI (not just locally).
- `@fission-ai/openspec`, `prettier-plugin-packagejson`, `modern-web-guidance` all show as unused by both knip and depcheck (CLI-only tooling, per AGENTS.md's existing carve-out) — should `knip.json` ignore them by name, or should knip's own `ignoreDependencies` pattern be scoped more generally to "anything AGENTS.md's Agent Tooling Packages section lists"? Left to the implementation bead.
