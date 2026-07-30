## ADDED Requirements

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
