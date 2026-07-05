# drawer-space-manager Specification

## Purpose
TBD - created by archiving change drawer-space-manager. Update Purpose after archive.
## Requirements
### Requirement: Custom Space Creation

The web application SHALL provide a form where a user enters a name, a storage system, and positive integer columns/rows plus a positive depth/height, and on submission creates exactly one new `SpaceTemplate` and one new `SpaceInstance` sized to those values, adds both to the store, and sets the new space as active.
The form SHALL validate input before calling any store action, so an invalid submission never partially adds a template without a matching space instance.

#### Scenario: Custom dimensions produce a matching grid

- **WHEN** a user enters 5 columns, 4 rows, and a depth, selects a storage system, and submits the create-space form
- **THEN** the active canvas renders a space sized 5×4 in the entered units, with `state.activeSpaceId` pointing at the newly created space

#### Scenario: Newly created space starts with no constraints

- **WHEN** a custom space is created via the form
- **THEN** its `SpaceInstance.constraints` is empty and the layout selector resolves it with `validity: "valid"` and zero placed bins, matching the packer's documented empty-constraints contract

#### Scenario: Invalid input is rejected before mutating the store

- **WHEN** the form is submitted with a non-numeric or non-positive value for columns, rows, or depth
- **THEN** no template or space is added to the store, `state.activeSpaceId` is unchanged, and an inline validation error is shown

### Requirement: Space Switching

The web application SHALL list every space currently in `state.spaces` and SHALL let a user select any one of them as the active space, updating `state.activeSpaceId` via the store's existing `setActiveSpace` action.
The currently active space SHALL be visibly distinguished from the others in the list.

#### Scenario: Switching active space updates the canvas and BOM

- **WHEN** two or more spaces exist and a user selects a space other than the currently active one from the list
- **THEN** `state.activeSpaceId` updates to the selected space's id, and the layout canvas and BOM panel re-render to reflect that space's own resolution

#### Scenario: Active space is visibly marked

- **WHEN** the space list renders
- **THEN** exactly one entry — the one matching `state.activeSpaceId` — is visually marked as active

