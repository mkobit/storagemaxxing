# storage-layout Specification

## Purpose

The storage-layout capability is the golden-path product slice: a user selects a storage system and a set of bins, and the web application renders a 2D layout showing those bins packed into a bounded space.
This spec governs the catalog lookups, the synchronous geometric packer, the store selector that derives layout from sketch state, and the web rendering that closes the loop end-to-end.
Any requirement here is verified by a named test cited in its body.
## Requirements
### Requirement: Catalog Golden-Path Systems

The catalog SHALL resolve a complete golden-path selection: at least one storage system with a set of compatible bin specifications retrievable by ID.

Verified by: `packages/catalog/test/golden-path.test.ts` > "resolves a storage system and its starter bins by id".

#### Scenario: Resolve starter bins

- **WHEN** the golden-path system ID and its starter bin IDs are looked up in the catalog
- **THEN** every lookup returns a fully-populated `BinSpec` with valid dimensions and no lookup returns `undefined`.

### Requirement: Golden-Path Packing

Given a bounded 2D space and a set of bin specifications, `packSpace()` SHALL produce a placement for each bin that fits, with no overlapping placements and no placement outside the space bounds.

Verified by: `packages/packer/test/golden-path.test.ts` > "packs starter bins into a bounded space without overlap".

#### Scenario: Pack starter bins

- **WHEN** `packSpace()` is called with the golden-path space template and starter bin set
- **THEN** the returned `PackingResult` contains one placement per bin, all placements are mutually non-overlapping, and all placements lie within the space bounds.

#### Scenario: Overflow is reported, not silently dropped

- **WHEN** the bin set cannot fully fit in the space
- **THEN** the `PackingResult` explicitly identifies the unplaced bins in its validity state.

### Requirement: Store Layout Derivation

The store SHALL expose a pure selector that derives the packed layout for the active sketch by invoking `packSpace()`, so that UI state and packing output cannot diverge.
The selector SHALL consume the catalog `BinSpec` for each constrained bin and SHALL convert it to the packer's `PackInput` shape via a helper owned by `packages/packer`, so that no two packages own a type called `BinSpec`.

Verified by: `packages/store/test/golden-path.test.ts` > "derives packed layout from the active sketch".

#### Scenario: Layout follows sketch state

- **WHEN** the active sketch contains the golden-path space and starter bins
- **THEN** the layout selector returns the same `PackingResult` as calling `packSpace()` directly with that sketch's inputs.

#### Scenario: Selector consumes catalog BinSpec and emits PackInput

- **WHEN** the store selector resolves a constrained bin through the catalog
- **THEN** it consumes a `BinSpec` exported by `packages/catalog` and converts it to a `PackInput` exported by `packages/packer` before calling `packSpace()`, with no intermediate `BinSpec` type owned by `packages/assembly`.

### Requirement: Rendered Layout

The web application SHALL render the packed placements from the store layout selector so that a user selecting a system and bins sees the resulting 2D layout.

Verified by: `apps/web/e2e/golden-path.spec.ts` > "user selects a system and bins and sees a packed layout".

#### Scenario: Golden path end to end

- **WHEN** a user selects the golden-path storage system and adds the starter bins
- **THEN** the canvas displays one rendered placement per bin positioned according to the `PackingResult`.

