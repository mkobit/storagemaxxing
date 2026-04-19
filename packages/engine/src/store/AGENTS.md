# store/

## Responsibility

This package manages the immutable Zustand application state, selectors, and localStorage persistence. It centralizes state mutations via typed actions.

## Type Ownership

Owns: `AppState`, `ActiveIds`, `UIMode`, `SolverCache`.

## Import Rules

- **May import from**: `geometry/`, `catalog/`, `assembly/`, `engine/`, `solver/`.
- **Must not import from**: `workers/`, `ui/`.
- **Other rules**: Immutable updates only (via spread). Selectors must be strictly pure functions. Actions may have side effects (like triggering workers).
