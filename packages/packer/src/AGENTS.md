# packer/

## Responsibility

This package contains spatial layout algorithms and pure geometric calculations. It houses placement heuristics and 2D/3D bin packing logic.

## Type Ownership

Owns: `PackerOptions`, `PlacementResult`, `Node`.

## Import Rules

- **May import from**: `geometry/`, `assembly/`.
- **Must not import from**: `solver/`, `store/`, `workers/`, `ui/`, `catalog/`.
- **Other rules**: Must be 100% pure functions. No classes. No state. Outputs must be entirely deterministic based on inputs.
