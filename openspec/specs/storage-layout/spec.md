# storage-layout Specification

## Purpose

The storage-layout capability is the golden-path product slice: a user selects a storage system and a set of bins, and the web application renders a 2D layout showing those bins packed into a bounded space.
This spec governs the catalog lookups, the synchronous geometric packer, the store selector that derives layout from sketch state, and the web rendering that closes the loop end-to-end.
Any requirement here is verified by a named test cited in its body.
## Requirements
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
A bin whose effective height exceeds the space's defined height SHALL never appear in `placedBins`, regardless of how well its footprint would otherwise fit, and a space with an undefined height SHALL impose no height constraint.
A height-ineligible bin under a `hard` or `soft` constraint mode with a positive minimum demand SHALL produce a `metrics.failures` entry with `reason: "heightOverflow"` and SHALL downgrade `validity` exactly as an unmet count-based minimum would (`invalid` for an unmet hard minimum, `partial` for an unmet soft minimum with hard minimums otherwise met); a height-ineligible bin under `auto` or `off` mode, or with no positive minimum demand, SHALL produce no failure and SHALL NOT change `validity`.

Verified by: `packages/packer/test/golden-path.test.ts` > "packs starter bins into a bounded space without overlap" AND `packages/packer/test/golden-path.test.ts` > "empty constraints array returns a valid empty result" AND `packages/packer/test/golden-path.test.ts` > "a bin taller than the space is excluded and reported as a heightOverflow failure".

#### Scenario: Pack starter bins

- **WHEN** `packSpace()` is called with the golden-path space template and starter bin set
- **THEN** the returned `PackingResult` contains one placement per bin, all placements are mutually non-overlapping, and all placements lie within the space bounds.

#### Scenario: Overflow is reported, not silently dropped

- **WHEN** the bin set cannot fully fit in the space
- **THEN** the `PackingResult` explicitly identifies the unplaced bins in its validity state.

#### Scenario: Empty constraints returns valid empty result

- **WHEN** `packSpace()` is called with a valid space template and an empty constraints array
- **THEN** the returned `PackingResult` has `validity === "valid"`, `placedBins.length === 0`, and `metrics.failures.length === 0`.

#### Scenario: Hard-constrained bin taller than the space is excluded and invalidates

- **WHEN** `packSpace()` is called with a space of height 2 and a `hard`-mode constraint demanding at least one bin whose effective height (including tolerance) is 3
- **THEN** the bin does not appear in `placedBins`, `metrics.failures` contains an entry with `reason: "heightOverflow"`, `binHeight: 3`, `spaceHeight: 2`, and `binId` identifying the bin, and `validity` is `"invalid"`.

#### Scenario: Soft-constrained bin taller than the space yields a partial result

- **WHEN** `packSpace()` is called with a space of height 2, a `soft`-mode constraint demanding at least one bin whose effective height is 3, and all `hard`-mode constraints in the same call are otherwise satisfied
- **THEN** the bin does not appear in `placedBins`, `metrics.failures` contains a `heightOverflow` entry for that bin, and `validity` is `"partial"`.

#### Scenario: Auto or off-mode bin taller than the space is excluded without failing

- **WHEN** `packSpace()` is called with an `auto`-mode or `off`-mode constraint referencing a bin whose effective height exceeds the space's height
- **THEN** the bin does not appear in `placedBins`, no `heightOverflow` entry is added to `metrics.failures` for that bin, and `validity` is unaffected by that bin.

#### Scenario: Space without a defined height is height-unconstrained

- **WHEN** `packSpace()` is called with a `SpaceTemplate` whose `h` is `undefined`
- **THEN** no bin is excluded on height grounds, `metrics.failures` contains no `heightOverflow` entries, and packing proceeds exactly as it did before this requirement's height clause existed.

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

