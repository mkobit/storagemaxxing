<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Dead-code detection (knip)

- [x] 1.1 [sm-oxc3](../../../.beads) Add `knip.json` with entry points and ignore patterns for known dynamic-resolution cases
  - Notes: entry list names the 5 harness-invoked hook scripts referenced in `.claude/settings.json` (`lint-on-edit.ts`, `typecheck-on-edit.ts`, `openspec-validate-on-edit.ts`, `openspec-canonical-guard-on-edit.ts`, `git-commit-main-guard.ts`); an ignore/entry declaration for `apps/web/e2e/fixtures/catalogWithDrillFixture.ts` (only reachable via the `E2E_DRILL_FIXTURE=true` Vite alias in `apps/web/vite.config.ts`); and `ignoreDependencies` entries for the CLI-only tooling packages (`@fission-ai/openspec`, `prettier-plugin-packagejson`, `modern-web-guidance`) per AGENTS.md's Agent Tooling Packages carve-out. Do not add a separate entry for `.agents/hooks/claude-hook.ts` -- it resolves transitively once the 5 real entry scripts are declared.
  - Validation: `bunx knip` output's "Unused files" section is empty, and none of the 5 hook scripts, `claude-hook.ts`, or the e2e fixture appear in any finding category.
  - Scope: scope:tooling
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-dead-code-detection-gate

- [x] 1.2 [sm-xsqx](../../../.beads) Wire `bunx knip` as an advisory step inside the existing `lint` CI job
  - Notes: new step in `.github/workflows/ci.yml`'s `lint` job (after the existing "Gitignore/eslint-ignores parity check" step), running `bunx knip` with `continue-on-error: true`. No new job -- reuses the job's existing checkout/mise/install steps.
  - Validation: `gh run view <run-id> --json jobs -q '.jobs[] | select(.name=="lint") | .steps[].name'` includes a knip step; a deliberately-introduced unused export on a scratch branch shows up in the step's output but does not fail the `lint` job.
  - Scope: scope:infra
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-advisory-first-gate-rollout

- [x] 1.3 [sm-y22j](../../../.beads) Triage knip's real unused-devDependency backlog
  - Notes: of the 7 flagged unused devDeps, 3 are presumably the CLI-only tooling packages already carved out via `ignoreDependencies` in task 1.1 -- confirm against a fresh `bunx knip` run at claim time. Triage whatever remains (~4) by either removing the dependency from `package.json` or adding real usage.
  - Validation: `bunx knip` reports zero entries under "Unused devDependencies" outside the `ignoreDependencies` list configured in task 1.1.
  - Scope: scope:tooling
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-dead-code-detection-gate

- [ ] 1.4 [sm-dgbl](../../../.beads) Triage knip's unused-export, unused-exported-type, and duplicate-export backlog (35 + 24 + 4 findings)
  - Notes: design.md confirms two sites directly (`CreateSpaceInput` in `apps/web/src/ui/spaceManager/CreateSpaceForm.ts`, `WireframePolygon` in `apps/web/src/ui/wireframeScene.ts`) but does not enumerate the remaining ~61 findings or confirm they're confined to `apps/web`. Re-run `bunx knip` at claim time; if findings span multiple packages, split this into one bead per affected package/app before claiming (each bead needs exactly one `scope:` per the Bead task contract). For each finding, either narrow the export to module-private or add it to an explicit, reasoned `knip.json` ignore entry.
  - Validation: `bunx knip` reports zero entries under "Unused exports", "Unused exported types", and "Duplicate exports" (or each remaining finding sits in an explicit, reasoned `knip.json` ignore entry).
  - Scope: scope:apps/web (best-effort from the two confirmed examples -- verify and re-scope per Notes above)
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-dead-code-detection-gate

## 2. Coverage threshold

- [x] 2.1 [sm-7bz6](../../../.beads) Exclude test-helper-only modules from coverage via `coveragePathIgnorePatterns`
  - Notes: add `coveragePathIgnorePatterns` to both `bunfig.toml` and `apps/web/bunfig.toml`, excluding `packages/geometry/src/testing.ts` (and any other test-factory-only module found at implementation time). Safe to ship immediately -- unlike `coverageThreshold`, this only changes what Bun counts, not whether the command's exit code changes, so it does not need to wait for the advisory-to-blocking flip.
  - Validation: `bun test packages ./.agents/hooks --coverage` output's per-file table no longer lists `packages/geometry/src/testing.ts`.
  - Scope: scope:tooling
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-coverage-threshold-gate

- [ ] 2.2 [sm-x41r](../../../.beads) Add an advisory coverage-threshold check as a dedicated CI step, decoupled from the blocking `test` job
  - Notes: new script (e.g. `scripts/check-coverage-threshold.ts`, following the existing `scripts/check-gitignore-eslint-parity.ts` pattern) that runs coverage with `--coverage-reporter=lcov` (or parses the text summary) and compares against `{ line = 0.90, function = 0.85 }` (packages+hooks) / `{ line = 0.85, function = 0.80 }` (apps/web) -- re-measure both baselines immediately before shipping per design.md Decision 2, since they drift. Wired as its own CI step with `continue-on-error: true`. Do NOT set `bunfig.toml`'s `coverageThreshold` during this task -- `bun test --coverage` must keep failing only on real test failures, exactly as it does today post-sm-wghm.
  - Validation: the dedicated step runs and reports its comparison in CI output; a deliberately-lowered local coverage run confirms the script flags a miss while `continue-on-error: true` keeps the step from failing the job, and a deliberately-broken test in the same run still fails the job (proving the two failure modes stay decoupled).
  - Scope: scope:infra
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-advisory-first-gate-rollout

## 3. Eslint-comment disable hygiene

- [x] 3.1 [sm-jiqu](../../../.beads) Register `@eslint-community/eslint-plugin-eslint-comments` in a new advisory-only ESLint config, run as a dedicated CI step
  - Notes: new `eslint.config.advisory.ts` extending the base `eslint.config.ts` plugin-registration pattern (top-of-file import, `plugins: {}` block), adding only `no-unlimited-disable` and `require-description`. New CI step running ESLint against this config with `continue-on-error: true`. Do NOT register these rules in the main `eslint.config.ts` -- `bun run lint` (`eslint . --max-warnings 0`) is already zero-tolerance, so that would make them blocking immediately.
  - Validation: the advisory step reports the known 19-site backlog (tasks 3.2-3.6) as violations in CI output without failing the `lint` job.
  - Scope: scope:infra
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-advisory-first-gate-rollout

- [x] 3.2 [sm-c1su](../../../.beads) Write `--` justifications for eslint-disable-next-line comments in `packages/assembly`
  - Notes: `SpaceConstraint.ts` lines 86, 98, 108 and `SpaceTemplate.ts` line 64 -- all `@typescript-eslint/consistent-type-assertions`. 4 sites, real content work: state why each site needs the type assertion, not a mechanical find-and-replace.
  - Validation: `bunx eslint --config eslint.config.advisory.ts packages/assembly/src/SpaceConstraint.ts packages/assembly/src/SpaceTemplate.ts` reports zero `require-description` violations.
  - Scope: scope:assembly
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-eslint-comment-disable-hygiene

- [ ] 3.3 [sm-m0ar](../../../.beads) Write `--` justifications for eslint-disable-next-line comments in `packages/geometry`
  - Notes: `testing.ts` lines 46, 52, 63; `Point3D.ts` line 6; `Point2D.ts` lines 17, 31. 6 sites across 3 files (all `@typescript-eslint/consistent-type-assertions` except `testing.ts:46`, which also covers `@typescript-eslint/no-empty-object-type`/`no-unused-vars`).
  - Validation: `bunx eslint --config eslint.config.advisory.ts packages/geometry/src/testing.ts packages/geometry/src/Point3D.ts packages/geometry/src/Point2D.ts` reports zero `require-description` violations.
  - Scope: scope:geometry
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-eslint-comment-disable-hygiene

- [x] 3.4 [sm-jrr8](../../../.beads) Write `--` justification for the eslint-disable-next-line comment in `packages/packer`
  - Notes: `packer.ts` line 125 (`@typescript-eslint/consistent-type-assertions`). 1 site.
  - Validation: `bunx eslint --config eslint.config.advisory.ts packages/packer/src/packer.ts` reports zero `require-description` violations.
  - Scope: scope:packer
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-eslint-comment-disable-hygiene

- [x] 3.5 [sm-3rhz](../../../.beads) Write `--` justifications for eslint-disable-next-line comments in `packages/store`
  - Notes: `layoutSelectors.ts` line 157 (`@typescript-eslint/consistent-type-assertions`); `useStore.ts` lines 17, 21, 99 (`functional/no-expression-statements`). 4 sites across 2 files.
  - Validation: `bunx eslint --config eslint.config.advisory.ts packages/store/src/layoutSelectors.ts packages/store/src/useStore.ts` reports zero `require-description` violations.
  - Scope: scope:store
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-eslint-comment-disable-hygiene

- [ ] 3.6 [sm-timr](../../../.beads) Write `--` justifications for eslint-disable-next-line comments in `apps/web`
  - Notes: `apps/web/src/ui/bom/BOMHeader.tsx` line 16 and `apps/web/src/ui/Toolbar.tsx` lines 26, 28, 38 -- all `functional/immutable-data`. 4 sites across 2 files. Distinct from the already-fixed `LayoutCanvas.tsx` file-wide disables (sm-3u1c), which already carry reasons and are not part of this backlog.
  - Validation: `bunx eslint --config eslint.config.advisory.ts apps/web/src/ui/bom/BOMHeader.tsx apps/web/src/ui/Toolbar.tsx` reports zero `require-description` violations.
  - Scope: scope:apps/web
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-eslint-comment-disable-hygiene

## 4. Advisory-to-blocking flip triggers (forcing functions)

Filed now, at advisory-rollout time, per design.md Decision 4's forcing-function requirement -- not left to be remembered informally. None of these three are actionable at filing time; each is blocked on its own flip trigger below, not on other tasks in this file.

- [ ] 4.1 [sm-e2jn](../../../.beads) Flip knip to blocking once its backlog is zero
  - Notes: remove `continue-on-error: true` from the knip CI step (task 1.2) once tasks 1.3 and 1.4 close -- every real finding fixed or in a reasoned `knip.json` ignore entry.
  - Validation: `.github/workflows/ci.yml`'s knip step has no `continue-on-error`; a deliberately-reintroduced dead export fails the `lint` job. Trigger condition (per design.md Decision 4): tasks 1.3 and 1.4 closed. Not immediately actionable.
  - Scope: scope:infra
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-advisory-first-gate-rollout

- [ ] 4.2 [sm-jb1j](../../../.beads) Flip coverage threshold to blocking once one week of zero-miss CI runs on `main` is observed
  - Notes: add `coverageThreshold` to `bunfig.toml` (re-measure before setting; design.md's `{ line = 0.90, function = 0.85 }` is a starting point, not a final value) and `apps/web/bunfig.toml` (re-measure; design.md's `{ line = 0.85, function = 0.80 }` starting point), retire the advisory script/step from task 2.2.
  - Validation: `bun test packages ./.agents/hooks --coverage` and `bun --cwd apps/web test src --coverage` exit non-zero when coverage regresses below the configured threshold, with no separate advisory script remaining. Trigger condition (per design.md Decision 4): one week of CI runs on `main` showing zero threshold misses in the advisory step -- a time-based condition, not blocked on another task in this file. Note this explicitly (label/comment) when the bead is filed so it isn't mistaken for immediately actionable.
  - Scope: scope:tooling
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-advisory-first-gate-rollout

- [ ] 4.3 [sm-1631](../../../.beads) Flip eslint-comments hygiene to blocking once its backlog is zero
  - Notes: move `no-unlimited-disable`/`require-description` into the main `eslint.config.ts`'s existing plugin-registration block, retire `eslint.config.advisory.ts` and its CI step, once tasks 3.2-3.6 close.
  - Validation: `bun run lint` (the existing blocking command) passes repo-wide with both rules active; `eslint.config.advisory.ts` no longer exists. Trigger condition (per design.md Decision 4): tasks 3.2-3.6 closed. Not immediately actionable.
  - Scope: scope:tooling
  - Spec: openspec/changes/ci-quality-gates/specs/automated-verification/spec.md#requirement-advisory-first-gate-rollout

## 5. Explicitly out of scope (deferred elsewhere, no implementation task here)

- `@storagemaxxing/packer` unused-dependency finding (knip's "2 unused deps", `apps/web/package.json:26:6` and `packages/assembly/package.json:12:6`) -- proposal.md's Impact section names this as follow-up work discovered during scoping, not part of this change's implementation.
- sm-620t (dangling `tsconfig.json` `paths` aliases for `assembly`/`catalog`/`geometry` pointing at deleted `src/index.ts` barrels) -- filed separately per proposal.md's Why section; discovered-from this epic but not implemented here.
- Per-package (vs. per-invocation) coverage granularity -- design.md Decision 2 confirms Bun's `coverageThreshold` has no per-package mechanism within one invocation; a fix would require restructuring CI's two-invocation topology, explicitly out of scope.
- The 0%-coverage-invisible-to-instrumentation blind spot (a real-logic file with no test-reachable import is never counted in either direction of the ratio) -- design.md's Decision 2 and Risks sections accept this as residual risk, partially mitigated by knip's unused-file/export detection (Section 1 above), not solved directly.
- `knip.json`'s ongoing maintenance burden as new dynamic-resolution patterns (hooks, Vite aliases) are added in the future -- design.md's Risks section flags this as an ongoing cost, not a one-time implementation task.
- No caching plan for the knip CI step -- design.md's Risks section marks this low-priority; revisit only if runtime becomes a visible CI cost.
