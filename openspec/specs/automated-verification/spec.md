## Purpose

Ensure system reliability and correctness through automated CI/CD pipelines and end-to-end verification of key user stories.
## Requirements
### Requirement: Green Deploy Pipeline

The system SHALL support a fully automated deployment pipeline to Cloudflare Pages that triggers on every push to `main`.

#### Scenario: Production deployment

- **WHEN** code is merged into the `main` branch
- **THEN** GitHub Actions MUST run all tests and lints before deploying to the production environment.

### Requirement: UX Automation as Verification

Key user stories SHALL be verified using Playwright E2E tests as a mandatory part of the feature definition.

#### Scenario: New feature verification

- **WHEN** a new packing algorithm is introduced
- **THEN** a corresponding Playwright test MUST verify that the visual output matches the expected layout constraints in the browser.

### Requirement: Golden-Path Regression Tripwire

The CI pipeline SHALL run the golden-path end-to-end test (`apps/web/e2e/golden-path.spec.ts`) on every pull request, and a failure SHALL block merge.

#### Scenario: Golden path breaks

- **WHEN** a change causes the golden-path E2E test to fail
- **THEN** the CI run MUST fail and the pull request MUST NOT be merged until the test passes.

### Requirement: Executable Acceptance Criteria

Every implementation bead SHALL carry an acceptance criterion that is runnable as a command (test, lint, or typecheck invocation), so completion is machine-verifiable.

#### Scenario: Bead without runnable acceptance

- **WHEN** an implementation bead's acceptance criteria cannot be expressed as a runnable command
- **THEN** the bead MUST be re-scoped or flagged for human decision via `bd human` before an agent claims it.

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

### Requirement: Test-Only Fixture Injection Seam

When an e2e scenario requires catalog data that has no defensible real-catalog equivalent, the system SHALL support injecting a synthetic fixture into the catalog at runtime, gated by a build-time flag that defaults to off and is only enabled by a dedicated Playwright project's `webServer` environment.
The fixture-injection code path and any fixture data SHALL be excluded from production builds.

#### Scenario: Fixture-gated e2e project exercises a synthetic bin

- **WHEN** the dedicated fixture-enabled Playwright project starts its dev server with the injection flag set
- **THEN** the synthetic fixture bin MUST appear in the catalog the running app renders, alongside all real catalog entries

#### Scenario: Production build excludes the fixture

- **WHEN** `apps/web` is built for production without the injection flag set
- **THEN** the build output MUST NOT contain the fixture data or the fixture-injection code path

#### Scenario: Default dev server has no fixture

- **WHEN** the app is started via the standard dev server command with no injection flag set
- **THEN** the catalog MUST contain only real catalog entries, unchanged from today's behavior

### Requirement: Dead-Code Detection Gate

The CI pipeline SHALL run a dead-code / unused-export / unused-dependency detector (knip) against the whole monorepo, configured to account for this repo's dynamic Vite aliasing, Claude Code hook entry points, and the agent-only tooling packages AGENTS.md's "Agent Tooling Packages" section deliberately keeps out of the application import graph.

#### Scenario: Genuinely dead code is flagged

- **WHEN** a source file, export, or `package.json` dependency has no reachable consumer anywhere in the repo (verified against the actual import graph, not a heuristic)
- **THEN** the dead-code detection step MUST report it

#### Scenario: Known dynamic-resolution patterns do not false-positive once configured

- **WHEN** a file is only reachable through a runtime-conditional Vite alias (e.g. `apps/web/e2e/fixtures/catalogWithDrillFixture.ts`, aliased in `apps/web/vite.config.ts` only when `E2E_DRILL_FIXTURE=true`) or is a Claude Code hook script invoked by the harness rather than imported by any TypeScript file (`.agents/hooks/*.ts`)
- **THEN** the tool's configuration MUST list it as a known entry point or ignore pattern so it is not reported as dead

### Requirement: Coverage Threshold Gate

Each of the two CI test invocations (`bun test packages ./.agents/hooks --coverage` and `bun --cwd apps/web test src --coverage`) SHALL enforce a minimum coverage threshold via that invocation's own `bunfig.toml`, set from a real measured baseline rather than an arbitrary round number, with test-helper-only modules excluded from the calculation via `coveragePathIgnorePatterns`.

#### Scenario: Coverage regression below threshold fails CI

- **WHEN** a change lowers either invocation's measured function or line coverage below that invocation's configured `coverageThreshold`
- **THEN** the corresponding `bun test --coverage` command MUST exit non-zero and the CI job MUST fail

#### Scenario: Test-helper modules do not count against the threshold

- **WHEN** a module exists solely to provide test factories/helpers (e.g. `packages/geometry/src/testing.ts`, which imports from `bun:test`) rather than product logic
- **THEN** it MUST be excluded from the coverage threshold calculation via `coveragePathIgnorePatterns`, so its partial internal usage does not gate unrelated product-code changes

### Requirement: Eslint-Comment Disable Hygiene

ESLint SHALL enforce, repo-wide, that every `eslint-disable` comment is scoped with a matching `eslint-enable` (never left open for the rest of the file) and carries a `--` justification, via `@eslint-community/eslint-plugin-eslint-comments`'s `no-unlimited-disable` and `require-description` rules.

#### Scenario: File-wide disable is rejected

- **WHEN** a new `/* eslint-disable <rule> */` comment is added with no matching `/* eslint-enable <rule> */` before the end of the file
- **THEN** `bun run lint` MUST fail, reproducing the sm-3u1c finding as an enforced rule instead of a one-time manual fix

#### Scenario: Disable without a reason is rejected

- **WHEN** an `eslint-disable` comment (file-wide or scoped) has no `--` justification text
- **THEN** `bun run lint` MUST fail

### Requirement: Advisory-First Gate Rollout

Each new gate introduced by this capability (dead-code detection, coverage threshold, eslint-comment hygiene) SHALL run in a non-blocking, advisory mode in CI until its pre-existing-finding backlog is triaged to zero or an explicit allowlist, at which point it SHALL be flipped to blocking independently of the other gates.

#### Scenario: New gate does not block merges while advisory

- **WHEN** a gate is in its advisory rollout period
- **THEN** a finding from that gate MUST be visible in the CI run's output but MUST NOT fail the job or block merge

#### Scenario: Gate flips to blocking independently once its backlog clears

- **WHEN** a given gate's pre-existing findings reach zero (or are recorded in an explicit, reviewed allowlist)
- **THEN** that gate alone is reconfigured to fail the job on a new finding, without waiting for the other two gates to reach the same state

#### Scenario: Advisory mode MUST NOT mask an unrelated blocking check sharing the same invocation

- **WHEN** a gate's check would otherwise run inside the same command invocation as an existing blocking check (e.g. the coverage-threshold gate sharing `bun test --coverage` with real test-failure detection, or the eslint-comments gate sharing `eslint . --max-warnings 0` with the existing zero-tolerance lint rules)
- **THEN** the advisory gate MUST run as a separate, dedicated invocation whose exit code alone is suppressed, so that suppressing the advisory gate's findings during its rollout period can never also suppress a genuine failure of the pre-existing blocking check it shares a command with

#### Scenario: A follow-up bead exists to force each gate's flip evaluation

- **WHEN** a gate ships in advisory mode
- **THEN** a dedicated follow-up bead ("flip `<gate>` to blocking once its backlog is zero") MUST be filed at rollout time, so the flip decision does not depend solely on continued incidental attention to the parent epic

