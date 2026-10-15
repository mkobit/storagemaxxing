# Space Modeler CAD UX Specification

## ADDED Requirements

### Requirement: 2D Orthographic Canvas and Dynamic Tape-Measure Grid

The web application SHALL provide a 2D orthographic drawing canvas for sketching storage space footprints in world inches.
The canvas SHALL display an adaptive Cartesian tape-measure grid whose subdivisions scale with zoom level: 6-inch and 2-inch intervals at coarse zoom, 1-inch and 1/2-inch intervals at medium zoom, and 1/4-inch, 1/8-inch, and 1/16-inch intervals at close zoom.
The canvas SHALL display fractional inch rulers on the top horizontal axis and left vertical axis.
The canvas SHALL snap cursor coordinates to active grid subdivisions within an 8-pixel threshold.

#### Scenario: User sketches rectangle on snap grid

- **GIVEN** an active 2D orthographic sketch canvas
- **WHEN** the user drags a rectangle from coordinate (0, 0) near coordinate (24.1, 15.9)
- **THEN** the coordinates snap to (24.0, 16.0) inches and display on the canvas rulers

### Requirement: Dimension Heads-Up Display Controls

The web application SHALL render an inline dimension heads-up display (HUD) adjacent to the active sketch segment.
The HUD SHALL allow direct keyboard entry of dimensions using fractional inches, decimal inches, or metric millimeters.
The HUD SHALL toggle focus between width and length fields on `Tab` keypress, commit the dimension on `Enter` keypress, and cancel on `Escape` keypress.

#### Scenario: User enters fractional dimension in HUD

- **GIVEN** a drawn line segment with active dimension HUD
- **WHEN** the user types "14 3/8" into the HUD input and presses `Enter`
- **THEN** the segment length updates to exactly 14.375 inches

### Requirement: 3D Extrusion Drag Gizmo

When a 2D sketch loop closes, the web application SHALL render a shaded planar profile and transition the viewport camera to an isometric 30-degree elevation.
The application SHALL render a single-axis translation arrow gizmo at the centroid of the closed profile pointing along the normal vector.
Dragging the arrow gizmo SHALL extrude the 2D footprint into a 3D void volume with live height readout and 1/8-inch snap increments.

#### Scenario: User extrudes closed footprint to drawer depth

- **GIVEN** a closed 2D polygon footprint in isometric view
- **WHEN** the user drags the arrow gizmo along the normal axis to 6 inches
- **THEN** the canvas renders a 3D void volume with height 6.0 inches and an active height badge

### Requirement: Interactive Face Role Assignment

The web application SHALL enable interactive raycast selection of boundary faces on the extruded 3D void volume.
The user SHALL be able to designate the access face (`top`, `front`, `top+front`, `all-sides`), the gravity support face (`bottom`, `back`), and mounting surface installation constraints.
The user SHALL be able to place 3D bounding-box obstacles and planar dividers within the void volume.

#### Scenario: User assigns front-access role to shelf face

- **GIVEN** an extruded 3D cubby void volume
- **WHEN** the user clicks the front planar face and selects access role
- **THEN** the front face highlights and the space accessFace attribute is set to "front"

### Requirement: Serialized SpaceTemplate Contract Emission

The web application SHALL serialize finished space models into an immutable `SpaceTemplate` contract validated by Zod schema.
The serialized contract SHALL contain outer bounding dimensions (`w`, `l`, `h`), ordered footprint polygon vertices, extrusion metadata, access face, obstacles, and installation constraints.
The application SHALL dispatch the `SpaceTemplate` to the store and downstream solvers without coupling solver algorithms to the CAD UI.

#### Scenario: Finished model emits validated SpaceTemplate

- **GIVEN** a modeled space with irregular footprint, 12-inch height, and a pipe obstacle
- **WHEN** the user confirms the space definition
- **THEN** a validated `SpaceTemplate` JSON object is created and passed to the store
