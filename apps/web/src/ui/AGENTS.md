# ui/

## Responsibility

This package contains all React components.
It maps state to DOM, dispatches store actions, and handles rendering.
It is the only package that touches the DOM.

## Type ownership

Owns UI specific domain concepts: `ViewMode` (enum), `StrategyCard`, `ConstraintRowProps`, `ExportFormat` (enum).

## Import rules

- **May import from**: All other packages.
- **Must not import from**: Cannot be imported by ANY other package.
- **Other rules**: Components must be pure functions of props and state.
  Props are strictly `readonly`.
  Avoid inline business logic in components.

## UI/UX Testing with Playwright

Playwright is our primary tool for developing and testing user stories and application flows.
We prefer End-to-End (E2E) testing over isolated component testing because it validates the integration of the UI, Store, and Solver.

- **User Stories**: Every major feature must have a corresponding test in `apps/web/e2e/`.
- **Testing**:
  - **Behavioral Testing**: Tests should simulate real user actions (click, type, drag) and assert outcomes in the DOM (e.g., BOM updates, Validity Badge changes).
  - **Regression**: E2E tests serve as our primary defense against regressions in the solver and packing logic.
  - **Performance**: Use Playwright to ensure the UI remains responsive during complex packing operations.

## Build & Infrastructure

- **Bundling**: We use Bun's native static HTML bundler (`bun build ./index.html`).
- **Dev Server**: A simple Bun-native server (`serve.ts`) serves the application during development.
- **Deployment**: The `dist/` directory produced by `bun run build` is a standalone static site.
