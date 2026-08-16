# installation-constraints Specification

## ADDED Requirements

### Requirement: railPresent Catalog Unlock Filtering

The application SHALL let a user specify whether a space has a mounting rail installed (`railPresent`).
Bins declaring `installation: { type: "rail" }` SHALL be locked/disabled in the catalog list and excluded from `PackInput` UNLESS `railPresent` is set on the space.

#### Scenario: railPresent unlocks rail-requiring bins

- **WHEN** a space template includes a `railPresent` constraint
- **THEN** catalog bins with `installation.type === "rail"` are enabled in the catalog list and eligible for `packSpace`

#### Scenario: Missing railPresent locks rail-requiring bins

- **WHEN** a space template does NOT include a `railPresent` constraint
- **THEN** catalog bins with `installation.type === "rail"` render greyed/disabled in the catalog list and are excluded from packing

### Requirement: maxWeightLbs Space Constraint Validation

The application SHALL allow users to set a maximum weight limit (`maxWeightLbs`) per space.
When total weight across placed bins in a space exceeds `maxWeightLbs`, `selectPackedLayout` SHALL include a `weightOverflow` failure in `LayoutResolution.failures`.

#### Scenario: Placed weight within maxWeightLbs limit

- **WHEN** total placed bin weight is less than or equal to `maxWeightLbs`
- **THEN** `LayoutResolution` contains no `weightOverflow` failure

#### Scenario: Placed weight exceeds maxWeightLbs limit

- **WHEN** total placed bin weight exceeds `maxWeightLbs`
- **THEN** `LayoutResolution.failures` contains a `WeightOverflowFailure` detailing `maxWeightLbs` and `actualWeightLbs`
