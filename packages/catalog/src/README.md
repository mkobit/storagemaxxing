# Catalog source (`packages/catalog/src`)

## Overview

Defines Zod schemas and TypeScript types for storage systems, parts, and bin specifications, along with built-in bin catalogs (Akro-Mils, Gridfinity, openGrid, Schaller), golden-path starter IDs, and pure catalog lookup helpers.

## Interface

- `PartIdSchema`, `createBasePartSchema` (`BasePart.ts`) — Branded `'PartId'` Zod string schema and base part object schema factory.
- `createPartDimensionsSchema` (`PartDimensions.ts`) — Generic dimensions schema factory (`width`, `height`, `depth`).
- `StorageSystemSchema`, `StorageSystem` (`StorageSystem.ts`) — Storage system enum (`'schaller' | 'gridfinity' | 'akromils' | 'opengrid' | 'custom'`).
- `AKROMILS_CATALOG` (`akromils.ts`) — Built-in `ReadonlyArray<BinSpec>` of 13 Akro-Mils bins.
- `BinId`, `binId`, `BinSpec` (`bin.ts`) — Branded `'BinId'` type/parser and `StandardBinSpec<T> | AccessoryBinSpec<T>` discriminated union on `kind`.
- `CatalogSource` (`catalogSource.ts`) — `'builtin' | 'csv_import' | 'user_defined'` union type.
- `GOLDEN_PATH_SYSTEM`, `GOLDEN_PATH_STARTER_BIN_IDS` (`goldenPath.ts`) — Default `'gridfinity'` system and four starter bin IDs.
- `GRIDFINITY_CATALOG` (`gridfinity.ts`) — Built-in `ReadonlyArray<BinSpec>` of 36 Gridfinity bins and 4 accessories.
- `InstallationRequirement` (`installationRequirement.ts`) — Installation requirement interface (`'drill' | 'rail' | 'adhesive' | 'freestanding' | 'stack-only'`).
- `ALL_BINS`, `findBinById`, `binsForDepth` (`lookup.ts`) — Combined catalog and pure lookup/depth-filter functions.
- `OPENGRID_CATALOG` (`opengrid.ts`) — Built-in `ReadonlyArray<BinSpec>` of 36 openGrid bins and 2 accessories.
- `SCHALLER_CATALOG` (`schaller.ts`) — Combined `ReadonlyArray<BinSpec>` of `SCHALLER_PART_0` through `SCHALLER_PART_7`.
- `schaller_data`: [./schaller_data/README.md](./schaller_data/README.md) — Static Schaller bin catalog part modules (`part_0.ts`–`part_7.ts`).

## Invariants

- `PartIdSchema` (`BasePart.ts`) and `binId` (`bin.ts`) enforce Zod-branded strings (`'PartId'`, `'BinId'`).
- `BinSpec` (`bin.ts`) requires `kind: 'bin'` with `accessoryType?: never` for `StandardBinSpec`, and `kind: 'accessory'` with `accessoryType` for `AccessoryBinSpec`.
- `gridDimensions` (`gridfinity.ts`) uses a `42mm` grid unit, `7mm` height unit, and `0.5mm` fit tolerance subtracted from nominal `w`/`l` (`0` height tolerance), converted to inches (`/ 25.4`).
- `gridDimensions` (`opengrid.ts`) uses a `28mm` base unit and `3mm` divider thickness tolerance subtracted from nominal `w`/`l` (`0` height tolerance), converted to inches (`/ 25.4`).
- `AKROMILS_CATALOG` (`akromils.ts`) defines actual `w`/`l` as nominal minus `0.1 in`, actual `h` equal to nominal `h`, and `0.05 in` tolerance on all axes.
- `binsForDepth` (`lookup.ts`) filters bins by `bin.nominal.h <= maxDepth`.

## Side effects

- None.

## Verification

- Run: `bun test packages/catalog`
