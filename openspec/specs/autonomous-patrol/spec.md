# Autonomous Patrols

System for managing recurring, protocol-driven duties for autonomous agents.

## Definition
A Patrol is a recurring task defined by a stored prompt that an agent executes periodically to maintain repository integrity.

## Requirements

### R1: Stored Prompt Authority
- Patrol instructions MUST be stored in `.jules/prompts/` as Markdown files.
- The prompt SHALL contain a clear Goal, Frequency, and Step-by-Step Protocol.

### R2: Recurring Execution
- Patrols SHALL be instantiated via the `autonomous-patrol` Beads formula.
- The system MUST track the current execution state as a comment on the patrol bead.

### R3: Jules Registry
- The first instruction for any autonomous agent (Jules) MUST be to check for assigned `meta:patrol` beads.
