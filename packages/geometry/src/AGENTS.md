# geometry/

## Responsibility

This package contains Euclidean spatial primitives and pure mathematics. It handles concepts related strictly to math and space, without any domain-specific application concepts.

## Type Ownership

```ts-exports
CABINET_PROJECTION
Dimensions2D
Dimensions2DSchema
Dimensions3D
GridCoord
GridDimensions
Inches
InchesSchema
Millimeters
MillimetersSchema
ObliqueProjection
Point
Point2D
Point2DSchema
Point3D
Rect
Rect2D
Rect2DSchema
Size
createDimensions2D
createDimensions3D
createGridDimensions
createInches
createMillimeters
createPoint2D
createPoint3D
createRect
createRect2D
createSize
formatDim
formatFraction
inSize
inToMm
inches
ins
mm
mmSize
mmToIn
mms
parseDim
parseFraction
projectPoint
```

## Import Rules

- **May import from**: Nowhere. This package must have zero internal dependencies to other `src/` packages.
- **Must not import from**: ANY other `src/` package.
- **Other rules**: Must be entirely pure functions with no side effects.
