## ADDED Requirements

### Requirement: Immutable 2D Primitives
The system SHALL provide a set of foundational 2D primitives (Point, Size, Rect) that are strictly immutable and use functional patterns.

#### Scenario: Primitive Creation
- **WHEN** a new Point or Size is instantiated
- **THEN** it MUST be represented as a readonly object or tuple that cannot be mutated after creation.

### Requirement: Multi-Unit Support
All spatial primitives SHALL support explicit units (e.g., mm, inches) to prevent calculation errors across different organization systems.

#### Scenario: Unit Validation
- **WHEN** performing calculations between two primitives with different units
- **THEN** the system MUST either perform an explicit conversion or throw a validation error.

### Requirement: Runtime Validation
All primitives SHALL have corresponding Zod schemas to ensure data integrity during serialization or when receiving input from external sources.

#### Scenario: Invalid Input
- **WHEN** a primitive is created with negative dimensions or invalid types
- **THEN** the Zod schema MUST fail validation with a descriptive error.
