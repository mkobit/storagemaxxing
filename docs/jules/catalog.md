# Catalog: System & Bin Definitions

This bead defines the schema and process for adding new storage systems to Storagemaxxing.

## 1. Bin Specification (`BinSpec`)
Every bin in the catalog must provide:
- `id`: Globally unique string (e.g., `schaller-1x2x3-red`).
- `nominal`: The dimensions used for UI display (Inches or MM).
- `actual`: The true physical dimensions (MM preferred for engine).
- `tolerance`: Safety buffer added to `actual` during packing.
- `price`: Catalog price in USD.
- `catalogSource`: Provenance of the data (e.g., `builtin`, `csv`, `user`).

## 2. System Taxonomy
- **Vendor (Schaller, Akro-Mils):** Fixed dimensions, fixed prices.
- **Grid (Gridfinity, openGrid):** Parameterized by grid units (e.g., 2x4).
- **Custom:** User-provided dimensions via CSV or manual entry.

## 3. How to Add a New System
1. Define the `BinSpec` list in `packages/catalog/src/`.
2. Update `packages/catalog/src/index.ts` to export the new catalog.
3. Add validation tests in `packages/catalog/src/lookup.test.ts`.
4. Register the system compatibility in the PRD §5.2.

## Linked Beads
- Product: `product.md`
- Constraints: `constraints.md`
