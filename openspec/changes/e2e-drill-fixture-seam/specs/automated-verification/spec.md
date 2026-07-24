## ADDED Requirements

### Requirement: Test-Only Fixture Injection Seam

When an e2e scenario requires catalog data that has no defensible real-catalog equivalent, the system SHALL support injecting a synthetic fixture into the catalog at runtime, gated by a build-time flag that defaults to off and is only enabled by a dedicated Playwright project's `webServer` environment.
The fixture-injection code path and any fixture data SHALL be excluded from production builds via dead-code elimination.

#### Scenario: Fixture-gated e2e project exercises a synthetic bin

- **WHEN** the dedicated fixture-enabled Playwright project starts its dev server with the injection flag set
- **THEN** the synthetic fixture bin MUST appear in the catalog the running app renders, alongside all real catalog entries

#### Scenario: Production build excludes the fixture

- **WHEN** `apps/web` is built for production without the injection flag set
- **THEN** the build output MUST NOT contain the fixture data or the fixture-injection code path

#### Scenario: Default dev server has no fixture

- **WHEN** the app is started via the standard dev server command with no injection flag set
- **THEN** the catalog MUST contain only real catalog entries, unchanged from today's behavior
