# catalog/

## Responsibility

This package contains static vendor product data and lookup functions. It houses all pre-defined dimensions and specs for supported storage systems.

## Type Ownership

```ts-exports
AKROMILS_CATALOG
ALL_BINS
AccessoryType
BinId
BinSpec
CatalogSource
GOLDEN_PATH_STARTER_BIN_IDS
GOLDEN_PATH_SYSTEM
GRIDFINITY_CATALOG
InstallationRequirement
OPENGRID_CATALOG
PartIdSchema
SCHALLER_CATALOG
SCHALLER_PART_0
SCHALLER_PART_1
SCHALLER_PART_2
SCHALLER_PART_3
SCHALLER_PART_4
SCHALLER_PART_5
SCHALLER_PART_6
SCHALLER_PART_7
StorageSystem
StorageSystemSchema
binId
binsForDepth
createBasePartSchema
createPartDimensionsSchema
findBinById
```

## Import Rules

- **May import from**: `geometry/` ONLY
- **Must not import from**: `packer/`, `assembly/`, `store/`, `web/`
- **Other rules**: All exports must be frozen `as const` or `ReadonlyArray`. No runtime mutation. Pure functions for lookups only.
