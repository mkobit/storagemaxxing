## Why

Autonomous agents like Jules need a deterministic way to find and execute recurring tasks without manual prompting. We need to transition from "one-off instructions" to "stored, persistent protocols" that Jules can execute repeatedly. This ensures constant progress on repository hygiene, alignment, and implementation tasks.

## What Changes

- Create a persistent store for agent instructions at `.jules/prompts/`.
- Implement Beads "Patrol" formulas that instruct agents to: "Read the protocol at `.jules/prompts/<name>.md` and execute it."
- Establish a "Registry of Duties" for autonomous agents.

## Capabilities

### New Capabilities
- `stored-prompts`: A directory-based system for persistent agent protocols.
- `autonomous-patrols`: Beads formulas for recurring tasks (Backlog Hygiene, Design Linking, Tagging).
- `duty-stations`: A protocol for agents to report their "Patrol Results" back to the task graph.

## Impact

- **Filesystem**: New folder `.jules/prompts/`.
- **Beads**: New formula `bd mol pour autonomous-patrol`.
- **Agent Lifecycle**: Jules will now look for "Patrol" beads as its primary source of daily work.

## Success Criteria

- A stored prompt for "Backlog Alignment" exists in `.jules/prompts/`.
- A Beads Patrol is active that directs Jules to execute that prompt.
- Scheduled agents in the Jules UI can source the code and execute the patrol protocols autonomously.
