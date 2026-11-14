# BOM UI

## Overview

Provides React components (`BOMTable`, `BOMHeader`, `BOMRow`, `BOMSummary`) and a CSV serializer (`exportBOMToCSV`) for rendering a Bill of Materials table, displaying catalog item details and estimated totals, and exporting BOM data to CSV.

## Interface

- `[BOMHeader.tsx:BOMHeader]` `React.FC<BOMHeaderProps>` (`{ readonly bom: BOM }`) rendering the BOM heading and CSV download button.
- `[BOMRow.tsx:BOMRow]` `React.FC<BOMRowProps>` (`{ readonly item: BOMItem }`) rendering a table row with SKU, name, optional Accessory badge, quantity, unit price, and total.
- `[BOMSummary.tsx:BOMSummary]` `React.FC<BOMSummaryProps>` (`{ readonly totalPrice: number; readonly isApproximatePrice: boolean; readonly itemCount: number }`) rendering the total estimated cost and optional approximate-price note.
- `[BOMTable.tsx:BOMTable]` `React.FC<BOMTableProps>` (`{ readonly bom: BOM }`) composing `BOMHeader`, the BOM items table, and `BOMSummary`.
- `[exportCSV.ts:exportBOMToCSV]` `(bom: BOM, catalog: ReadonlyArray<BinSpec>) => string` returning CSV with header `SKU,Name,Quantity,Unit Price,Total Price,System,Source`.
- `[BOMHeader.stories.tsx:default]` Storybook `Meta<typeof BOMHeader>` with stories `Default` and `EmptyDownloadDisabled`.
- `[BOMRow.stories.tsx:default]` Storybook `Meta<typeof BOMRow>` with stories `Default`, `Accessory`, and `UnknownBin`.
- `[BOMSummary.stories.tsx:default]` Storybook `Meta<typeof BOMSummary>` with stories `Default`, `ApproximatePrice`, and `EmptyRendersNothing`.
- `[BOMTable.stories.tsx:default]` Storybook `Meta<typeof BOMTable>` with stories `Default`, `Empty`, `MixedBinsAndAccessories`, `MultiSpaceAggregate`, and `ApproximatePrice`.

## Invariants

- `[BOMHeader.tsx:BOMHeader]` Disables the Download CSV button when `bom.items.length === 0`.
- `[BOMRow.tsx:resolveRowData]` Falls back to `sku = item.binId`, `name = 'Unknown Item'`, `price = 0`, `total = 0`, `kind = 'unknown'`, `isAccessory = false` when `findBinById(ALL_BINS, binId(item.binId))` returns `undefined`; otherwise uses `spec.price ?? 0`, `total = price * item.quantity`, and `isAccessory = (spec.kind === 'accessory')`.
- `[BOMSummary.tsx:BOMSummary]` Returns `null` when `itemCount === 0`; formats `totalPrice` with `toFixed(2)` and displays `*` plus the approximate-price notice when `isApproximatePrice` is `true`.
- `[BOMTable.tsx:BOMTable]` Renders an empty-state row spanning 5 columns when `bom.items.length === 0`.
- `[exportCSV.ts:sanitizeCSVField]` Prefixes values starting with `=`, `+`, `-`, or `@` with a single quote (`'`).
- `[exportCSV.ts:formatRow]` Double-quotes `Name` with internal `"` escaped as `""`; falls back to `item.binId` (`sku`), `'Unknown'` (`name`), `0` (`price`), `'unknown'` (`system`), and `'unknown'` (`catalogSource`); formats `price` and `total` with `toFixed(2)`.

## Side effects

- `[BOMHeader.tsx:handleDownload]` Creates an object URL via `URL.createObjectURL(blob)`, creates an `<a>` element, sets `link.href`, appends and clicks it on `document.body` to trigger download of `'storagemaxxing_bom.csv'`, removes the element, and revokes the URL via `URL.revokeObjectURL(url)`.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
