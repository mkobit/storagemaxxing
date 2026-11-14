# Assembly source (`packages/assembly/src`)

## Overview

Defines Zod-validated domain schemas, immutable types, and pure factory and aggregation functions for storage spaces, constraints, placed bins, packing results, and bills of materials (BOM), depending on `@storagemaxxing/catalog`, `@storagemaxxing/geometry`, and `zod`.

## Interface

- `SpaceTypeIdSchema`, `BinSpecIdSchema`, `BinSpecId`, `InstallationConstraintSchema`, `DividerSchema`, `ObstacleSchema`, `PackingStrategyIdSchema`, `BOMItem`, `BOM` (`BaseTypes.ts`) — Core space type enums, bin ID aliases, installation constraint unions, dividers, obstacles, and BOM types.
- `ValidityState`, `CountConstraintFailure`, `HeightOverflowFailure`, `WeightOverflowFailure`, `ConstraintFailure`, `PackingMetrics`, `PackingResult`, `createConstraintFailure`, `createHeightOverflowFailure`, `createWeightOverflowFailure`, `createPackingMetrics`, `createPackingResult` (`PackingResult.ts`) — Packing validity states, constraint failure types, metrics, and pure factories.
- `PlacedBin`, `PlacedBinSchema`, `createPlacedBin` (`PlacedBin.ts`) — Placed bin type, Zod schema, and pure factory.
- `SpaceConstraintSchema`, `SpaceConstraint`, `createSpaceConstraint` (`SpaceConstraint.ts`) — Mode-discriminated (`off`, `auto`, `soft`, `hard`) bin count constraint schema, type, and pure factory.
- `SpaceInstanceIdSchema`, `SpaceInstanceId`, `SpaceInstanceSchema`, `SpaceInstance` (`SpaceInstance.ts`) — Branded ID and readonly Zod schema/type for a concrete space instance.
- `SpaceTemplateIdSchema`, `SpaceTemplateId`, `AccessFace`, `SpaceTemplateSchema`, `SpaceTemplate`, `createSpaceTemplate` (`SpaceTemplate.ts`) — Branded ID, access face union, template Zod schema, type, and pure factory.
- `LookupBinFunction`, `computeBom`, `computeAggregateBom` (`bom.ts`) — Pure BOM calculation from a `PackingResult` or count map and across `SpaceInstance[]`.

## Invariants

- `InstallationConstraintSchema` (`BaseTypes.ts`) requires `maxWeightLbs.value` to be positive (`z.number().positive()`).
- `PlacedBinSchema` (`PlacedBin.ts`) requires `origin` to be a `Float32Array` of length `3`.
- `SpaceConstraintSchema` (`SpaceConstraint.ts`) enforces `lo <= hi` whenever `hi !== null` in `soft` and `hard` modes, and mode-specific bounds (`off`: `lo: 0, hi: 0`; `auto`: `lo: 0, hi: null, hard: false`; `soft`: `lo >= 0` int, `hard: false`; `hard`: `lo > 0` int, `hi > 0` int or `null`, `hard: true`).
- `createSpaceConstraint` (`SpaceConstraint.ts`) selects `hard` when `hardMin > 0` (setting `softLo` only when `softMin > hardMin`), else `soft` when `softMin > 0`, else `auto`, and casts `binId` to `BinSpecId` without running `BinSpecIdSchema.parse()`.
- `SpaceInstanceSchema` (`SpaceInstance.ts`) requires `count` to be a positive integer (`z.number().int().positive()`).
- `SpaceTemplateSchema` (`SpaceTemplate.ts`) requires either all of `w`/`l`/`h` defined or `footprint` defined, nonnegative `backClearance` if present, length-2 `Float32Array` footprint points, and defaults `gridResolution` to `0.5`.
- `createSpaceTemplate` (`SpaceTemplate.ts`) casts `id` to `SpaceTemplateId` without running `SpaceTemplateIdSchema.parse()` and defaults `type` to `'drawer'`, `packingModel` to `'2d'`, `installationConstraints` to `[]`, and `gridResolution` to `0.5`.
- `computeBom` (`bom.ts`) filters out non-positive quantities (`quantity > 0`), parses each `binId` with `BinSpecIdSchema.parse()`, and sets `isApproximatePrice` to `true` if any entry has an undefined spec, missing/non-number/`0` price, or `priceApproximate === true`.
- `computeAggregateBom` (`bom.ts`) scales each space's bin quantities by `space.count`, preferring `packingResultsBySpace[space.id]` and falling back to counting `space.placedBins`.

## Side effects

- None.

## Verification

- Run: `bun test packages/assembly`
