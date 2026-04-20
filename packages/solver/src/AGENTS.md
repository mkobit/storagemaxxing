# solver/

## Responsibility

This package defines optimization logic and linear programming models. It transforms application domain models into mathematical representations.

## Type Ownership

Owns: `SolverRequest`, `SolverResult`, `LinearModel`.

## Import Rules

- **May import from**: `geometry/`, `packer/`.
- **Must not import from**: `ui/`, `store/`.
- **Other rules**: Must be stateless pure functions.
