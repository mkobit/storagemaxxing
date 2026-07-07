## MODIFIED Requirements

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
