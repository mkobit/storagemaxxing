# solver/

## Responsibility

This package formulates constraint validation questions for GLPK.js. It does not perform placement, but simply parses and structures data to answer feasibility questions.

## Type Ownership

Owns: `SolverRequest`, `SolverResult`, `FeasibilityStatus`, `SuggestedCounts`, `LPVariable`, `LPConstraint`, `ConflictKind` (enum).

## Import Rules

- **May import from**: `geometry/`, `catalog/`, `assembly/`.
- **Must not import from**: `engine/`, `store/`, `workers/`, `ui/`.
- **Other rules**: Does NOT import GLPK.js directly. GLPK.js import and execution happens in `workers/`.
