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
