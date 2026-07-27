## ADDED Requirements

### Requirement: Parallel CI Job Execution

The CI pipeline SHALL run independent checks (lint, typecheck, test, Storybook build) as separate GitHub Actions jobs rather than sequential steps within one job, so no check is blocked behind an unrelated, slower check.

#### Scenario: Independent checks run concurrently

- **WHEN** a pull request triggers CI
- **THEN** lint, typecheck, test, and Storybook build MUST run as separate jobs with no `needs:` dependency between them, so GitHub Actions schedules them concurrently

### Requirement: Dependency and Browser Caching

The CI pipeline SHALL cache bun's install/download cache and the Playwright browser download across workflow runs, keyed on inputs that invalidate the cache when those inputs change.

#### Scenario: Cache hit skips re-download

- **WHEN** a CI run's lockfile hash (for bun) or Playwright version (for browsers) matches a previous run's cache key
- **THEN** the corresponding install/download step MUST restore from cache instead of re-downloading

#### Scenario: Cache miss falls back safely

- **WHEN** no matching cache entry exists, such as the first run after a lockfile or Playwright version change
- **THEN** the corresponding install/download step MUST proceed with a full download and succeed rather than fail

### Requirement: Pinned Action References

Every `uses:` reference in `.github/workflows/ci.yml` SHALL be pinned to a commit SHA, consistent with the pinning convention already used in `.github/workflows/beads.yml` and `.github/workflows/openspec.yml`.

#### Scenario: Checkout action is SHA-pinned

- **WHEN** `.github/workflows/ci.yml` is inspected
- **THEN** every `actions/checkout` `uses:` line MUST reference a commit SHA, not a mutable tag or branch

### Requirement: Recorded Skip-If-Unchanged Decision

The path-based skip-if-unchanged investigation named in sm-vd2g SHALL conclude with an explicit adopt, defer, or reject decision recorded in this change's design, accounting for the lint-enforced package DAG where a change to an upstream package requires re-running checks for its downstream dependents too.

#### Scenario: Decision is recorded, not silently dropped

- **WHEN** this change is reviewed
- **THEN** `design.md` MUST state whether skip-if-unchanged is adopted, deferred, or rejected, with reasoning tied to measured pipeline timing and the package DAG's transitive dependency structure
