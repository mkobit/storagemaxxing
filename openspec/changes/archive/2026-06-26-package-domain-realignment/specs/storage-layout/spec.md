## MODIFIED Requirements

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
