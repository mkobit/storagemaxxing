## MODIFIED Requirements

### Requirement: Custom Space Creation

The web application SHALL provide a space creation dialog or drawer accessible from the space management controls, rather than rendering an inline form in the persistent toolbar.
The space creation form SHALL validate input before calling any store action, requiring a name, a storage system, positive integer columns and rows, and positive depth.
On valid submission, the application SHALL create exactly one new `SpaceTemplate` and one new `SpaceInstance`, add both to the store, set the new space as active, and close the dialog or drawer.

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

The web application SHALL render a space switcher control in the primary application bar that displays the active space name and provides access to all spaces in `state.spaces`.
Selecting a space from the switcher SHALL update `state.activeSpaceId` via `setActiveSpace`, update the switcher label, and re-render the layout canvas and bill of materials for that space.

#### Scenario: Switching active space updates the canvas and BOM

- **WHEN** two or more spaces exist and a user selects a space other than the currently active one from the list
- **THEN** `state.activeSpaceId` updates to the selected space's id, and the layout canvas and BOM panel re-render to reflect that space's own resolution

#### Scenario: Active space is visibly marked

- **WHEN** the space list renders
- **THEN** exactly one entry — the one matching `state.activeSpaceId` — is visually marked as active
