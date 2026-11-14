# Geometry source (`packages/geometry/src`)

## Overview

Provides immutable 2D and 3D points and dimensions, branded inch and millimeter unit conversions, fraction parsing and formatting, oblique 3D-to-2D projection, and `bun:test` matcher helpers using `gl-matrix` and `zod`.

## Interface

- `Dimensions2DSchema`, `Dimensions2D`, `createDimensions2D` (`Dimensions2D.ts`) — Zod schema, readonly `{ w, l }` type, and factory for 2D dimensions.
- `Dimensions3D`, `createDimensions3D` (`Dimensions3D.ts`) — Readonly `{ w, l, h }` type and factory for 3D dimensions.
- `parseFraction`, `formatFraction` (`Fraction.ts`) — Parses decimals, slash fractions, and mixed numbers into `number | null`, and formats numbers using Unicode fraction glyphs or slash fractions.
- `GridDimensions`, `createGridDimensions` (`GridDimensions.ts`) — Readonly `{ cols, rows, depth? }` type and factory.
- `InchesSchema`, `Inches`, `inches`, `parseDim`, `formatDim` (`Inches.ts`) — Branded `"inches"` Zod schema, constructor, fraction string parser, and `″`-suffixed formatter.
- `Millimeters`, `mm`, `mmToIn`, `inToMm` (`Millimeters.ts`) — Branded `"mm"` type, constructor, and `25.4` mm/inch conversion helpers.
- `ObliqueProjection`, `CABINET_PROJECTION`, `projectPoint` (`ObliqueProjection.ts`) — Oblique 3D-to-2D projection type, cabinet projection constant, and projection function.
- `Point2DSchema`, `Point2D`, `createPoint2D` (`Point2D.ts`) — Zod schema accepting `[number, number]` or 2-element `Float32Array` transformed to `ReadonlyVec2`, type alias, and factory.
- `Point3D`, `createPoint3D` (`Point3D.ts`) — `ReadonlyVec3` type alias and factory.
- `Rect2DSchema`, `Rect2D`, `createRect2D` (`Rect2D.ts`) — Readonly `{ origin, dimensions }` Zod schema, type, and factory.
- `mm`, `mmToIn`, `inToMm`, `inches`, `Matchers` (`testing.ts`) — Re-exports unit helpers and augments `bun:test` `Matchers` with `toBeMm(expected)` and `toBeInches(expected)`.

## Invariants

- `Dimensions2DSchema` (`Dimensions2D.ts`) enforces numeric `w` and `l` on a readonly object.
- `parseFractionInternal` and `parseMixedNumberInternal` (`Fraction.ts`) reject zero denominators (`den !== 0`), returning `null`.
- `getMatchingDenominator` (`Fraction.ts`) formats only denominators `[2, 4, 8, 16, 32]` within `0.001` tolerance.
- `InchesSchema` (`Inches.ts`) and `MillimetersSchema` (`Millimeters.ts`) enforce branded numeric types at runtime via `.parse`.
- `mmToIn` and `inToMm` (`Millimeters.ts`) use the exact conversion factor `25.4` mm per inch.
- `CABINET_PROJECTION` (`ObliqueProjection.ts`) fixes `angleRadians` at `Math.PI / 6` and `depthScale` at `0.5`.
- `Point2DSchema` (`Point2D.ts`) requires `Float32Array` inputs to have `length === 2` or a `[number, number]` tuple.
- `Rect2DSchema` (`Rect2D.ts`) enforces `origin` (`Point2DSchema`) and `dimensions` (`Dimensions2DSchema`) on a readonly object.

## Side effects

- Importing `testing.ts` calls `expect.extend` to register `toBeMm` and `toBeInches` matchers on `bun:test` at module load time.
- All other modules in `packages/geometry/src` are pure with no external side effects.

## Verification

- Run: `bun test packages/geometry`
