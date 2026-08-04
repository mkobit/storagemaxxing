# geometry/

## Responsibility

This package contains Euclidean spatial primitives and pure mathematics. It handles concepts related strictly to math and space, without any domain-specific application concepts.

## Type Ownership

```ts-exports
CABINET_PROJECTION
Dimensions2D
Dimensions2DSchema
Dimensions3D
GridDimensions
Inches
InchesSchema
Millimeters
ObliqueProjection
Point2D
Point2DSchema
Point3D
Rect2D
Rect2DSchema
createDimensions2D
createDimensions3D
createGridDimensions
createPoint2D
createPoint3D
createRect2D
formatDim
formatFraction
inToMm
inches
mm
mmToIn
parseDim
parseFraction
projectPoint
```

## Import Rules

- **May import from**: Nowhere. This package must have zero internal dependencies to other `src/` packages.
- **Must not import from**: ANY other `src/` package.
- **Other rules**: Must be entirely pure functions with no side effects.
