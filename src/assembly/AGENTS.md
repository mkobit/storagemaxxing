# assembly/

## Responsibility
This package models the planning domain. It represents the logical spaces, furniture structure, rules, and global limits across the application.

## Type Ownership
Owns: `SpaceTemplate`, `SpaceInstance`, `SpaceConstraint`, `ConstraintMode` (enum), `Unit`, `Assembly`, `AggregateConstraint`, `GlobalLimit`, `Project`, `StorageCategory`, `InstallationConstraint`, `ValidityState` (enum), `Sketch2D`, `SketchElement`, `SketchRectangle`, `SketchLine`, `SketchElementType`.

## Import Rules
- **May import from**: `geometry/`, `catalog/`.
- **Must not import from**: `engine/`, `solver/`, `store/`, `workers/`, `ui/`.
