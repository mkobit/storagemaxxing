## ADDED Requirements

### Requirement: Printer Bed Constraint Validation

The system SHALL validate any calculated OpenGrid model against physical printer bed dimensions.

#### Scenario: Size Violation

- **WHEN** a modeled grid exceeds the configured printer bed size (e.g., 256mm x 256mm)
- **THEN** the system MUST flag the model as "unprintable" and provide the delta dimensions.

### Requirement: Board Size Suggestions

The system SHALL suggest optimal "printable board" sizes based on common printer bed defaults (e.g., 220mm, 250mm, 300mm).

#### Scenario: Default Suggestions

- **WHEN** a user requests suggestions for a large space
- **THEN** the system MUST return a list of standard board sizes that maximize the space while remaining within the printer's capabilities.

### Requirement: Multi-Board Tiling

The system SHALL support decomposing a large modeled space into multiple printable boards.

#### Scenario: Tiling Logic

- **WHEN** a space requires multiple boards
- **THEN** the system MUST return an array of board definitions that, when combined, cover the target area with minimal waste.
