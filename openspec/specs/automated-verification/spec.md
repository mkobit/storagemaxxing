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

