# assembly/

## Responsibility

This package defines the core domain models for user creations. It houses everything that gets saved in a project file.

## Type Ownership

Owns: `Project`, `Assembly`, `SpaceTemplate`, `SpaceConstraint`, `PlacedBin`, `SpaceInstance`.

## Import Rules

- **May import from**: `geometry/`, `catalog/`, `packer/`
- **Must not import from**: `solver/`, `store/`, `workers/`, `ui/`.
- **Other rules**: Types must be JSON serializable. Zod schemas must live alongside the types they validate. Use opaque/branded types for all ID strings to prevent cross-assignment.
