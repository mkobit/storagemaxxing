# assembly/

## Responsibility

This package defines the planning domain models: space geometry, packing constraints, placement results, and BOM computation.

## Type Ownership

```ts-exports
AccessFace
AccessFaceSchema
AggregateConstraint
AggregateConstraintSchema
BOM
BOMItem
BOMItemSchema
BOMSchema
BinSpecId
BinSpecIdSchema
ConstraintFailure
CountConstraintFailure
Divider
DividerSchema
HeightOverflowFailure
InchesZodSchema
InstallationConstraint
InstallationConstraintSchema
LookupBinFunction
Obstacle
ObstacleSchema
PackingMetrics
PackingPhase
PackingResult
PackingStrategyId
PackingStrategyIdSchema
PlacedBin
PlacedBinSchema
Point2DSchema
SpaceConstraint
SpaceConstraintAuto
SpaceConstraintAutoSchema
SpaceConstraintHard
SpaceConstraintHardSchema
SpaceConstraintOff
SpaceConstraintOffSchema
SpaceConstraintSchema
SpaceConstraintSoft
SpaceConstraintSoftSchema
SpaceInstance
SpaceInstanceId
SpaceInstanceIdSchema
SpaceInstanceSchema
SpaceTemplate
SpaceTemplateId
SpaceTemplateIdSchema
SpaceTemplateSchema
SpaceType
SpaceTypeIdSchema
StorageCategory
StorageCategoryId
StorageCategoryIdSchema
StorageCategorySchema
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
