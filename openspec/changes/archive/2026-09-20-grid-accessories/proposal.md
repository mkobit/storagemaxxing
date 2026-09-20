## Why

`packages/catalog/src/gridfinity.ts` and `opengrid.ts` only emit plain bin footprints today (`BinSpec` in `packages/catalog/src/bin.ts:12-28`).
The product's own roadmap (`docs/2026-04-13-PRD.md`, Phase 1) calls for Gridfinity accessories (hook, label, divider, blank) and OpenGrid accessories (hooks, accessory bins), referred to there as `GridAccessory`.
That type was never implemented — it exists only as PRD prose, with zero references anywhere in `packages/**`.
Both catalogs already support four vendor systems (Schaller, Akro-Mils, Gridfinity, OpenGrid) with plain bins only, so the two grid-based systems are incomplete relative to what they claim to support.
This is a catalog-breadth gap, not a new architectural capability: `agent_docs/product-strategy.md` prioritizes horizontal breadth (more storage systems, more complete systems) over vertical depth (3D/global solvers), and completing an already-supported system's catalog is the highest-leverage breadth work available right now.

## What Changes

- Add a `kind: "bin" | "accessory"` discriminant (plus `accessoryType` for accessories) to `BinSpec` in `packages/catalog/src/bin.ts`, so accessory items can be told apart from bins without changing existing bin behavior.
- Add Gridfinity accessory catalog data (label holders, dividers, blanks, hooks — 42mm/7mm-grid-derived dimensions) and OpenGrid accessory catalog data (hooks, accessory bins — 28mm-grid-derived dimensions).
- Wire the new accessory arrays into `ALL_BINS` (`packages/catalog/src/lookup.ts`) so accessories resolve through the same lookup path as bins.
- Add an "Add Accessories" UI section in `apps/web/src/ui/ConstraintEditorPanel.tsx`, reusing the existing `createSpaceConstraint` flow, filtered by `kind === "accessory"`.
- Add BOM UI grouping/labeling for accessory line items.
- Fix `docs/2026-04-13-PRD.md`'s incorrect claim that OpenGrid is a "75mm panel system" — the real spec and this repo's own `opengrid.ts:18-19` comment both say 28mm.

Every accessory category researched for both systems (labels, dividers, blanks, hooks, accessory bins) occupies at least one grid cell, exactly like existing bins.
They fit the existing packer/constraint/BOM pipeline unchanged as ordinary `BinSpec`-shaped catalog entries with a new discriminant field — no placement-logic changes are needed.

## Capabilities

### New Capabilities

- `grid-accessories`: catalog, lookup, and UI support for non-bin grid items (hooks, labels, dividers, blanks, accessory bins) in the Gridfinity and OpenGrid systems, placed and priced through the existing packing/constraint/BOM pipeline.

### Modified Capabilities

(none — existing `storage-layout` golden-path requirements for plain bins are unaffected; accessories are additive)

## Impact

- **Affected packages**: `packages/catalog` (new discriminant field, new catalog data, lookup wiring), `apps/web` (constraint editor UI, BOM UI). `packages/assembly` and `packages/packer` are unaffected — `computeBom` (`packages/assembly/src/bom.ts:79-112`) is already placement/type-agnostic, and the packer treats every `BinSpec` as a footprint rectangle regardless of `kind`.
- **Affected data**: `BinSpec` becomes a discriminated union with a required `kind` and an `accessoryType` required for accessory entries; existing bin entries remain `kind: "bin"`.
- **Docs**: one factual correction in `docs/2026-04-13-PRD.md` (OpenGrid base unit).

## Success Criteria

- `ALL_BINS` includes Gridfinity and OpenGrid accessory entries alongside existing bins, resolvable via the same `lookupBin` path.
- A user can add at least one accessory type per system (Gridfinity, OpenGrid) to a space via the Configure UI, see it placed, and see it priced in the BOM.
- Existing bin-only golden-path tests and specs continue to pass unmodified — accessory support is additive, not a breaking change to `BinSpec` consumers.
- `bun run typecheck`, `bun run lint`, and `bun test` pass with the new discriminant field in place.
