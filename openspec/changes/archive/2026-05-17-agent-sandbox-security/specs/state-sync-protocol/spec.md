## ADDED Requirements

### Requirement: Refresh-Before-Read
All agents SHALL pull the latest filesystem state before reading Beads or OpenSpec data.

#### Scenario: Jules starting a task
- **WHEN** Jules identifies a task in the backlog
- **THEN** it MUST perform a `git pull` or `bd sync` to ensure the local context matches the remote source of truth.

### Requirement: Task Claiming (Locking)
Agents MUST NOT modify a file unless they own the claim on the corresponding Beads task.

#### Scenario: Concurrent editing prevention
- **WHEN** Agent A is working on `pkg/packer/main.ts`
- **THEN** it MUST have an active `--claim` on the relevant bead to prevent Agent B from overlapping.
