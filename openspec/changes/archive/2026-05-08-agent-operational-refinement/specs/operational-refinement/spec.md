## ADDED Requirements

### Requirement: Mandatory Resume Check

All agents SHALL perform a "Design Authority Check" immediately upon session start.

#### Scenario: Agent starting work

- **WHEN** an agent runs `bd prime`
- **THEN** it MUST inspect `openspec/changes/` to see if the task graph is in sync with the design Brain.

### Requirement: Flowback Protocol

Agents SHALL update the canonical OpenSpec artifacts if the implementation phase reveals necessary design adjustments.

#### Scenario: Closing a task with design changes

- **WHEN** a developer realizes a schema change is needed during coding
- **THEN** they MUST update `design.md` or `spec.md` before running `bd close`.
