# assembly/

## Responsibility

This package defines the planning domain models: space geometry, packing constraints, placement results, and BOM computation.

## Type Ownership

```ts-exports
AccessFace
BOM
BOMItem
BinSpecId
BinSpecIdSchema
ConstraintFailure
CountConstraintFailure
DividerSchema
HeightOverflowFailure
InstallationConstraintSchema
LookupBinFunction
ObstacleSchema
PackingMetrics
PackingResult
PackingStrategyIdSchema
PlacedBin
PlacedBinSchema
SpaceConstraint
SpaceConstraintSchema
SpaceInstance
SpaceInstanceId
SpaceInstanceIdSchema
SpaceInstanceSchema
SpaceTemplate
SpaceTemplateId
SpaceTemplateIdSchema
SpaceTemplateSchema
SpaceTypeIdSchema
ValidityState
computeAggregateBom
computeBom
createConstraintFailure
createHeightOverflowFailure
createPackingMetrics
createPackingResult
createPlacedBin
createSpaceConstraint
createSpaceTemplate
```

## Import Rules

- **May import from**: `geometry/`, `catalog/`
- **Must not import from**: `packer/`, `store/`, `web/`
- **Other rules**: Types must be JSON serializable. Zod schemas must live alongside the types they validate. Use opaque/branded types for all ID strings to prevent cross-assignment.
