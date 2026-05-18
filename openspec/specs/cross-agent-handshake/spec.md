## Purpose

Standardize coordination and task handover processes between autonomous agents, ensuring architectural decisions are grounded in OpenSpec designs.

## Requirements

### Requirement: Beads-Based Task Handover

Agents SHALL use the `bd` CLI to claim, update, and close tasks to coordinate work across sessions and agents.

#### Scenario: Handing over a complex task

- **WHEN** Agent A completes a design but cannot finish implementation
- **THEN** it MUST leave the Beads issue in an `open` state with a comment linking to the relevant OpenSpec change and `tasks.md`.

### Requirement: OpenSpec Design Authority

No agent SHALL implement a `meta:breaking` or `scope:engine` feature without first creating or updating an OpenSpec `design.md` and obtaining approval.

#### Scenario: Jules implementing a new fitter

- **WHEN** Jules identifies a need for an "OpenGrid Fitter"
- **THEN** it MUST first draft the OpenSpec proposal and design before writing any TypeScript code.
