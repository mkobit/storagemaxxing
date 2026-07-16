# installation-constraints Specification

## Purpose
TBD - created by archiving change installation-constraints. Update Purpose after archive.
## Requirements
### Requirement: Bin Installation Declaration

`BinSpec` in `packages/catalog` SHALL accept an optional `installation` field of the existing `InstallationRequirement` type (`drill` / `rail` / `adhesive` / `freestanding` / `stack-only`).
Bins that omit the field SHALL be treated as having no installation requirement and SHALL never be filtered by installation constraints.

#### Scenario: Existing catalog entries are unaffected

- **WHEN** a catalog bin without an `installation` field is evaluated against any space, including one with `noDrill` set
- **THEN** the bin remains eligible for the constraint editor's catalog list and for packing, exactly as today

#### Scenario: A bin declares a drill requirement

- **WHEN** a catalog entry sets `installation: { type: "drill", ... }`
- **THEN** the catalog schema accepts it and the requirement is readable wherever the `BinSpec` is consumed

### Requirement: noDrill Space Constraint Filtering

The application SHALL let a user answer one plain-language question per space — "Can I drill into this space?" — in the constraint editor, storing the answer as a `{ type: "noDrill" }` entry in the space template's existing `installationConstraints` array.
While `noDrill` is set, bins whose `installation.type` is `"drill"` SHALL be greyed/disabled in the constraint editor's catalog list and SHALL be excluded from the bins passed to `packSpace`, so neither manual constraints nor auto-fill can place them.
`maxWeightLbs` and `railPresent` constraints are explicitly out of scope for this change and SHALL NOT be surfaced in the UI.

#### Scenario: noDrill greys drill-requiring bins in the catalog list

- **WHEN** a user marks the active space as not drillable
- **THEN** every bin with `installation.type === "drill"` renders greyed/disabled in the constraint editor's Add Bins list, and all other bins remain addable

#### Scenario: noDrill excludes drill-requiring bins from packing

- **WHEN** a space template carries a `noDrill` installation constraint and its constraints reference a drill-requiring bin
- **THEN** the packed layout for that space contains zero placements of that bin, including auto-fill placements

#### Scenario: Unsetting noDrill restores default behavior

- **WHEN** a user marks the space as drillable again (removing the `noDrill` entry)
- **THEN** no bin is filtered by installation requirement and packing behaves exactly as before this change

