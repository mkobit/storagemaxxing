## ADDED Requirements

### Requirement: Polygon-Based Footprints
The system SHALL support the definition of storage space footprints using ordered 2D vertices (polygons) to represent non-rectangular drawers and shelves.

#### Scenario: Irregular drawer modeling
- **WHEN** a user defines a footprint with vertices [(0,0), (24,0), (24,18), (12,18), (0,12)]
- **THEN** the system SHALL calculate the internal area and valid packing bounds for this irregular shape.

### Requirement: Access Orientation Awareness
Every space template MUST have an assigned access face (top, front, or side) that dictates packing depth visibility.

#### Scenario: Front-access shelf depth limit
- **WHEN** a space is marked as "front-access" with a depth of 14" and 4" bins are used
- **THEN** the system SHALL flag any bins placed behind the first row as "reduced accessibility" unless a user override is applied.

### Requirement: Fixed Obstacle Masking
The system SHALL allow the placement of fixed, permanent obstacles within a space that subtract from the available packing volume.

#### Scenario: Obstacle collision avoidance
- **WHEN** a 2"x2" permanent obstacle is placed in the center of a drawer
- **THEN** the packing engine SHALL NOT attempt to place any bins that overlap with the obstacle coordinates.
