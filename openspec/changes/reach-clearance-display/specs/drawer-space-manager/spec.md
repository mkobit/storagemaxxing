## ADDED Requirements

### Requirement: Reach Clearance Visual Indication

The web application SHALL visually indicate rear reach clearance for space templates where `backClearance` is defined and positive.
In the 2D layout canvas, the application SHALL draw a dashed line across the space width at depth `template.l - template.backClearance`, fill the area between that line and the back edge with a shaded band, and render an inline text label displaying the reach clearance and the resulting usable depth.
When `backClearance` is undefined or zero, the layout canvas SHALL render standard space bounds without a clearance band, dividing line, or clearance text label.
The packing engine placement calculations SHALL continue to evaluate full depth bounds `template.l`, treating reach clearance as an informational display attribute.

#### Scenario: Space template with positive reach clearance displays shaded zone and label

- **GIVEN** an active space template with length 20.0 inches, width 12.0 inches, and `backClearance` of 4.0 inches
- **WHEN** the 2D layout canvas renders the space bounds
- **THEN** a shaded band is rendered from depth 16.0 inches to 20.0 inches, a dashed dividing line is drawn across width 12.0 inches at depth 16.0 inches, and an inline label displaying "4.0in reach clearance (usable depth 16.0in)" is rendered

#### Scenario: Space template without reach clearance renders standard bounds only

- **GIVEN** an active space template with dimensions defined and `backClearance` undefined or 0
- **WHEN** the 2D layout canvas renders the space bounds
- **THEN** the outer boundary rectangle is stroked and no clearance band, clearance dividing line, or clearance text label is rendered

#### Scenario: Packing engine uses full depth regardless of reach clearance

- **GIVEN** a space template with length 20.0 inches and `backClearance` of 4.0 inches
- **WHEN** bins are packed into the space template
- **THEN** the packing engine evaluates placement against the full 20.0 inches depth without reserving or excluding the 4.0 inches reach clearance zone
