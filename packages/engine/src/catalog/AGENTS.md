# catalog/

## Responsibility
This package contains static vendor product data and lookup functions.
It houses all pre-defined dimensions and specs for supported systems.

## Type ownership
Owns: `BinSpec`, `GridBinSpec`, `GridAccessory`, `StorageSystem` (enum), `VendorPack`, `InstallationRequirement`.

## Import rules
- **May import from**: `geometry/` ONLY.
- **Must not import from**: `engine/`, `solver/`, `assembly/`, `store/`, `workers/`, `ui/`.
- **Other rules**: All exports must be frozen `as const` or `ReadonlyArray`.
No runtime mutation.
Pure functions for lookups only.
