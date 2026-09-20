## ADDED Requirements

### Requirement: Accessory Discriminant on BinSpec

`BinSpec` SHALL carry a `kind: "bin" | "accessory"` discriminant field.
Every existing catalog entry SHALL default to `kind: "bin"` so no existing bin-only consumer of `BinSpec` observes a behavior change.
An entry with `kind: "accessory"` SHALL additionally carry `accessoryType: "hook" | "label" | "divider" | "blank" | "cable_clip" | "custom"`.

Verified by: `packages/catalog/test/bin.test.ts` > "existing bin entries default to kind: bin" AND `packages/catalog/test/bin.test.ts` > "accessory entries require accessoryType".

#### Scenario: Existing bins are unaffected by the new discriminant

- **WHEN** an existing Schaller, Akro-Mils, Gridfinity, or OpenGrid bin entry is read
- **THEN** its `kind` field is `"bin"` and its shape is otherwise unchanged from before this change.

#### Scenario: Accessory entries are typed distinctly from bins

- **WHEN** a catalog entry has `kind: "accessory"`
- **THEN** it also carries a valid `accessoryType` and TypeScript rejects an accessory entry missing `accessoryType`.

### Requirement: Gridfinity and OpenGrid Accessory Catalog Data

The Gridfinity catalog SHALL include at least one accessory entry each for `hook`, `label`, `divider`, and `blank`, with dimensions derived from the Gridfinity 42mm/7mm grid unit.
The OpenGrid catalog SHALL include at least one accessory entry each for `hook` and an accessory bin (`custom` or a dedicated bin-shaped accessory type), with dimensions derived from the OpenGrid 28mm grid unit.
All accessory entries SHALL be resolvable through `ALL_BINS` and `findBinById` exactly as bins are today, with no separate lookup path.

Verified by: `packages/catalog/test/gridfinity.test.ts` > "includes hook, label, divider, and blank accessories" AND `packages/catalog/test/opengrid.test.ts` > "includes hook and accessory bin entries" AND `packages/catalog/test/lookup.test.ts` > "resolves accessory entries by id alongside bins".

#### Scenario: Gridfinity accessories are present and resolvable

- **WHEN** `ALL_BINS` is searched for Gridfinity entries with `kind: "accessory"`
- **THEN** at least one entry exists for each of `hook`, `label`, `divider`, and `blank`, and each resolves via `findBinById` by its `id`.

#### Scenario: OpenGrid accessories are present and resolvable

- **WHEN** `ALL_BINS` is searched for OpenGrid entries with `kind: "accessory"`
- **THEN** at least one `hook` entry and at least one accessory-bin entry exist, and each resolves via `findBinById` by its `id`.

### Requirement: Accessories Flow Through the Existing Packing and BOM Pipeline Unchanged

Accessory entries SHALL be placeable via the existing `packSpace()` / constraint flow with no changes to `packages/packer` placement logic — an accessory is packed as an ordinary footprint rectangle exactly like a bin.
`computeBom` and `computeAggregateBom` SHALL include accessory line items in BOM output using the same price/quantity derivation used for bins, keyed by the same `BinId` lookup.

Verified by: `packages/packer/test/golden-path.test.ts` > "packs an accessory entry into a bounded space without overlap" AND `packages/assembly/test/bom.test.ts` > "BOM includes accessory line items priced like bins".

#### Scenario: An accessory packs like a bin

- **WHEN** a space constraint set includes an accessory `BinId`
- **THEN** `packSpace()` places it without overlap and without any accessory-specific placement code path.

#### Scenario: BOM includes accessory line items

- **WHEN** a space's placed items include at least one accessory
- **THEN** `computeBom` includes a line item for that accessory with its price and quantity, using the same derivation as bin line items.

### Requirement: Accessory Selection UI

The Configure UI's constraint editor SHALL offer an "Add Accessories" section, filtered to `kind === "accessory"`, alongside the existing bin-selection UI, using the existing `createSpaceConstraint` flow with no new constraint-creation code path.
The BOM UI SHALL visually distinguish accessory line items from bin line items (e.g., grouping or a labeled badge).

Verified by: `apps/web` component/e2e test (per tasks.md) exercising accessory add-to-space and BOM display.

#### Scenario: A user adds an accessory to a space

- **WHEN** a user opens the constraint editor for a space and selects an accessory from the "Add Accessories" section
- **THEN** a space constraint is created for that accessory using the same flow as adding a bin, and the accessory appears in the space's layout once packed.

#### Scenario: BOM distinguishes accessories from bins

- **WHEN** a space's BOM includes both bins and accessories
- **THEN** the BOM UI renders accessory line items with a visible distinction (grouping or label) from bin line items.
