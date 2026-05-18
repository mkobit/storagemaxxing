## ADDED Requirements

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
