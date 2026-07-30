## ADDED Requirements

### Requirement: OpenGrid Grid Calculation

The system SHALL provide a pure functional utility to calculate a 2D grid of OpenGrid cells (standard 42mm pitch) given a target bounding box.

#### Scenario: Exact Fit

- **WHEN** a bounding box of 84mm x 84mm is provided
- **THEN** the system MUST return a 2x2 grid representation.

### Requirement: Fractional Cell Handling

The system SHALL allow configuring how partial cells are handled at the boundaries of the modeling area (e.g., truncate, round up, or center).

#### Scenario: Truncate Partial Cells

- **WHEN** a bounding box of 100mm x 100mm is provided and "truncate" mode is selected
- **THEN** the system MUST return a 2x2 grid (84mm x 84mm) and ignore the remaining 16mm.

### Requirement: Grid Metadata

Each modeled grid SHALL include metadata about total cell count, used area, and wasted area.

#### Scenario: Efficiency Metrics

- **WHEN** a grid is calculated
- **THEN** the output MUST include a numerical value for the percentage of the target bounding box covered by active cells.
