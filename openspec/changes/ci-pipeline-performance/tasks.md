<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Job parallelization

- [x] 1.1 [sm-nrbu](../../../.beads) Split `verify` job into parallel `lint`/`typecheck`/`test`/`build-storybook` jobs
  - Validation: `gh run view <run-id> --json jobs -q '.jobs[].name'` shows four separate job entries, all passing

## 2. Caching

- [x] 2.1 [sm-nj90](../../../.beads) Cache bun install/download cache across CI jobs
  - Validation: second CI run on an unchanged `bun.lock` shows a cache hit in the Actions log
- [x] 2.2 [sm-w3dt](../../../.beads) Cache Playwright browser download in the `e2e` job
  - Validation: second CI run's `playwright:install` step duration is measurably shorter than the first

## 3. Lint performance (highest measured cost, not in the original epic bullets)

- [ ] 3.1 [sm-cdiy](../../../.beads) Spike: ESLint `--cache` to reduce lint step duration
  - Validation: warm-cache lint step is measurably faster than cold, AND a deliberately introduced violation on a previously-cached file is still caught

## 4. Reproducibility

- [x] 4.1 [sm-7nlm](../../../.beads) Pin `actions/checkout` in `ci.yml` to the commit SHA already used in `beads.yml`/`openspec.yml`
  - Validation: `grep -n 'actions/checkout' .github/workflows/*.yml` shows identical SHA-pinned references across all three files

## 5. Skip-if-unchanged (decision, no implementation)

Investigated and explicitly **deferred** -- see `design.md` Decision 5.
Measured end-to-end pipeline time (~90-110s, bounded by the `e2e` job) and the lint-enforced package DAG's transitive-dependent complexity don't justify path-filtering logic today.
No implementation bead filed; revisit if pipeline time grows past ~5 minutes or a sixth+ package is added.
