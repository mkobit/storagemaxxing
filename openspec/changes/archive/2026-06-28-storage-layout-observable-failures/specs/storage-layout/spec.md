## MODIFIED Requirements

### Requirement: Catalog Golden-Path Systems

The catalog SHALL resolve a complete golden-path selection: at least one storage system with a set of compatible bin specifications retrievable by ID.
The catalog SHALL distinguish a lookup miss from a lookup error: `findBinById` MUST return `undefined` for an ID not present in the catalog and MUST NOT throw or return a placeholder bin.

Verified by: `packages/catalog/test/golden-path.test.ts` > "resolves a storage system and its starter bins by id" AND `packages/catalog/test/golden-path.test.ts` > "findBinById returns undefined for an unknown id".

#### Scenario: Resolve starter bins

- **WHEN** the golden-path system ID and its starter bin IDs are looked up in the catalog
- **THEN** every lookup returns a fully-populated `BinSpec` with valid dimensions and no lookup returns `undefined`.

#### Scenario: Unknown bin ID returns undefined

- **WHEN** `findBinById(ALL_BINS, id)` is called with an `id` not present in the catalog
- **THEN** the call returns `undefined`, does not throw, and does not return a placeholder bin.

### Requirement: Golden-Path Packing

Given a bounded 2D space and a set of bin specifications, `packSpace()` SHALL produce a placement for each bin that fits, with no overlapping placements and no placement outside the space bounds.
`packSpace()` SHALL accept an empty constraints array and return a `valid` empty result so an "empty selection" is a contract case, not coincidence.

Verified by: `packages/packer/test/golden-path.test.ts` > "packs starter bins into a bounded space without overlap" AND `packages/packer/test/golden-path.test.ts` > "empty constraints array returns a valid empty result".

#### Scenario: Pack starter bins

- **WHEN** `packSpace()` is called with the golden-path space template and starter bin set
- **THEN** the returned `PackingResult` contains one placement per bin, all placements are mutually non-overlapping, and all placements lie within the space bounds.

#### Scenario: Overflow is reported, not silently dropped

- **WHEN** the bin set cannot fully fit in the space
- **THEN** the `PackingResult` explicitly identifies the unplaced bins in its validity state.

#### Scenario: Empty constraints returns valid empty result

- **WHEN** `packSpace()` is called with a valid space template and an empty constraints array
- **THEN** the returned `PackingResult` has `validity === "valid"`, `placedBins.length === 0`, and `metrics.failures.length === 0`.

### Requirement: Store Layout Derivation

The store SHALL expose a pure selector that derives the packed layout for the active sketch by invoking `packSpace()`, so that UI state and packing output cannot diverge.
The selector SHALL consume the catalog `BinSpec` for each constrained bin and SHALL convert it to the packer's `PackInput` shape via a helper owned by `packages/packer`, so that no two packages own a type called `BinSpec`.
The selector SHALL return a tagged `LayoutResolution` value that distinguishes "no active space", "active space references a missing template", and "resolved" so that callers can render each case explicitly.

Verified by: `packages/store/test/golden-path.test.ts` > "derives packed layout from the active sketch" AND `packages/store/test/golden-path.test.ts` > "unresolved bin IDs are surfaced in LayoutResolution.unresolvedBinIds" AND `packages/store/test/golden-path.test.ts` > "missing template id produces LayoutResolution kind missing-template".

#### Scenario: Layout follows sketch state

- **WHEN** the active sketch contains the golden-path space and starter bins
- **THEN** the layout selector returns a `LayoutResolution` with `kind: "resolved"` whose `result` is the same `PackingResult` as calling `packSpace()` directly with that sketch's inputs and whose `unresolvedBinIds` is empty.

#### Scenario: Selector consumes catalog BinSpec and emits PackInput

- **WHEN** the store selector resolves a constrained bin through the catalog
- **THEN** it consumes a `BinSpec` exported by `packages/catalog` and converts it to a `PackInput` exported by `packages/packer` before calling `packSpace()`, with no intermediate `BinSpec` type owned by `packages/assembly`.

#### Scenario: Unresolved bin IDs are surfaced

- **WHEN** the active space contains a constraint whose `binId` is not present in the catalog
- **THEN** the layout selector returns `kind: "resolved"` with that `binId` included in `unresolvedBinIds`, and the `PackingResult` reflects only the constraints whose bins resolved.

#### Scenario: Missing template is reported

- **WHEN** the active space references a `templateId` not present in `state.templatesById`
- **THEN** the layout selector returns `kind: "missing-template"` carrying the offending `templateId`.

#### Scenario: No active space

- **WHEN** `state.activeSpaceId` is `null` or does not match any space in `state.spaces`
- **THEN** the layout selector returns `kind: "none"`.

#### Scenario: Multi-space selector preserves per-space resolution

- **WHEN** `selectPackingResultsBySpace` is called and one space resolves while another references a missing template
- **THEN** the returned record contains one entry per space in `state.spaces`, with each entry independently tagged by its own `LayoutResolution.kind`.

### Requirement: Rendered Layout

The web application SHALL render the packed placements from the store layout selector so that a user selecting a system and bins sees the resulting 2D layout.
The web application SHALL visibly distinguish the three `LayoutResolution` kinds (`none`, `missing-template`, `resolved`) and, within `resolved`, SHALL visibly distinguish the three `PackingResult.validity` states (`valid`, `partial`, `invalid`) so that a user cannot mistake a partial or invalid layout for a complete one.

Verified by: `apps/web/e2e/golden-path.spec.ts` > "user selects a system and bins and sees a packed layout" AND `apps/web/e2e/golden-path.spec.ts` > "non-valid pack surfaces a non-valid validity badge".

#### Scenario: Golden path end to end

- **WHEN** a user selects the golden-path storage system and adds the starter bins
- **THEN** the canvas displays one rendered placement per bin positioned according to the `PackingResult` and a validity indicator with `data-testid="layout-validity-badge"` reads `valid`.

#### Scenario: Non-valid pack is visibly distinguished

- **WHEN** the active space cannot fit every constrained bin and the packer returns a non-valid `validity` (`partial` or `invalid`)
- **THEN** the canvas renders the placements that fit AND an indicator with `data-testid="layout-validity-badge"` reads the exact `validity` value, not `valid`.

#### Scenario: Missing template renders an error state

- **WHEN** the selector returns `kind: "missing-template"`
- **THEN** the canvas hides and an element with `data-testid="layout-error-missing-template"` is visible, naming the offending `templateId`.

#### Scenario: Unresolved bin IDs are surfaced in the UI

- **WHEN** the selector returns `kind: "resolved"` with `unresolvedBinIds.length > 0`
- **THEN** an indicator with `data-testid="layout-unresolved-count"` is visible and reports the count.
