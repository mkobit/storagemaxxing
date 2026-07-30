## ADDED Requirements

### Requirement: Vite Development Server

The web application SHALL be developed using a Vite development server that supports Hot Module Replacement (HMR).

#### Scenario: HMR Update

- **WHEN** a change is saved in a React component in `apps/web/src/ui`
- **THEN** the browser should reflect the change instantly without a full page reload

#### Scenario: Workspace Resolution

- **WHEN** a change is saved in `packages/geometry/src/index.ts`
- **THEN** the `apps/web` development server SHALL trigger an update and reflect the change

### Requirement: Static Build Output

The build process SHALL produce a purely static set of files that MUST be hostable on Cloudflare Pages.

#### Scenario: Production Build

- **WHEN** `bun run build` is executed in `apps/web`
- **THEN** a `dist` folder is created containing `index.html` and bundled assets
- **AND** the `dist` folder SHALL be serveable by a simple static file server (e.g., `bun x serve dist`)

### Requirement: Tailwind CSS Integration

The application SHALL use Tailwind CSS for styling, managed via a Vite plugin and a custom token system.

#### Scenario: Custom Token Application

- **WHEN** a utility class using a custom token (e.g., `text-brand-primary`) is used
- **THEN** the CSS bundle SHALL include the corresponding color value

### Requirement: Testing Baseline

The web application SHALL have a verified baseline of unit and E2E tests.

#### Scenario: Sanity Unit Test

- **WHEN** `bun run test` is executed
- **THEN** at least one unit test verifying the core layout or geometry integration SHALL pass

#### Scenario: Playwright Smoke Test

- **WHEN** `bun run test:e2e` is executed
- **THEN** a headless browser SHALL navigate to the homepage and verify the presence of the main toolbar
