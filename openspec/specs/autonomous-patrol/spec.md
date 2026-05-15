## Purpose

Establish a system for managing recurring, protocol-driven duties for autonomous agents to maintain repository health and integrity.

## Requirements

### Requirement: Stored Prompt Authority
Patrol instructions MUST be stored in `.jules/prompts/` as Markdown files and contain a clear Goal, Frequency, and Step-by-Step Protocol.

#### Scenario: Defining a new patrol
- **WHEN** a new patrol for "Linting Audit" is created
- **THEN** it MUST be saved as `.jules/prompts/linting-audit.md` with a structured protocol.

### Requirement: Recurring Execution
Patrols SHALL be instantiated via the `autonomous-patrol` Beads formula and MUST track the current execution state.

#### Scenario: Running a patrol execution
- **WHEN** the `autonomous-patrol` formula is poured
- **THEN** a new Bead MUST be created and updated with the execution results in the comments.

### Requirement: Jules Registry
The first instruction for any autonomous agent (Jules) MUST be to check for assigned `meta:patrol` beads.

#### Scenario: Agent startup check
- **WHEN** Jules starts a new session
- **THEN** it MUST query Beads for issues with the `meta:patrol` label before picking up other tasks.
