# Schaller catalog data (`packages/catalog/src/schaller_data`)

## Overview

Defines static `ReadonlyArray<BinSpec>` catalog entries for 40 Schaller storage bins across 1-inch, 2-inch, and 3-inch depths, split into eight modules of five entries each.

## Interface

- `SCHALLER_PART_0` (`part_0.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_1` (`part_1.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_2` (`part_2.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_3` (`part_3.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_4` (`part_4.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_5` (`part_5.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_6` (`part_6.ts`) — Static array of five `BinSpec` entries.
- `SCHALLER_PART_7` (`part_7.ts`) — Static array of five `BinSpec` entries.

## Invariants

- None.

## Side effects

- None.

## Verification

- Run: `bun test packages/catalog`
