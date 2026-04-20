# store/

## Responsibility

This package manages the global application state using Zustand. It acts as the bridge between pure logic and the React UI layer.

## Type Ownership

Owns: `AppState`, `AppActions`, `ToolMode`.

## Import Rules

- **May import from**: `assembly/`, `catalog/`, `geometry/`, `packer/`.
- **Must not import from**: `ui/`, `workers/`.
- **Other rules**: Do not expose `set` or mutate functions directly to the UI. Define explicit actions (commands) for all state changes. Keep selectors fast.
