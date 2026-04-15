# geometry/

## Responsibility
This package contains Euclidean spatial primitives and pure mathematics. It handles concepts related strictly to math and space, without any domain-specific application concepts.

## Type Ownership
Owns: `Point2D`, `Point3D`, `Dimensions2D`, `Dimensions3D`, `Rect2D`, `Box3D`, `GridCoord`, `GridDimensions`, `Inches`, `Millimeters`, `AccessFace` (enum: top | front | top+front | all-sides), `GridUnit`, `Line2D`.

## Import Rules
- **May import from**: Nowhere. This package must have zero internal dependencies to other `src/` packages.
- **Must not import from**: ANY other `src/` package.
- **Other rules**: Must be entirely pure functions with no side effects.
