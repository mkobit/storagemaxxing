## Why

The initial "Agentic Prime" established the foundation, but early implementation revealed two critical gaps in the operational loop: (1) Agents resuming a session often skip the "Design Authority Check," and (2) there is no enforced protocol for back-porting execution-phase insights into the canonical specs. We need to formalize these to ensure the "Brain" (OpenSpec) and "Hands" (Beads) never drift.

## What Changes

- **Resume Protocol**: Mandate an immediate OpenSpec sync check upon session start.
- **Flowback Protocol**: Enforce bidirectional updates where execution insights must flow back into `design.md` or `specs/`.
- **Hierarchy Refinement**: Explicitly state that OpenSpec is the Canonical Source of Truth, and Beads is a derivative task graph.

## Capabilities

### New Capabilities
- `operational-refinement`: The updated 9-step Multi-Agent Handshake protocol.

### Modified Capabilities
- `agentic-prime`: Update to include the "Resume" and "Flowback" requirements.
- `cross-agent-handshake`: Update to emphasize the canonical authority of the filesystem.

## Impact

- **Files**: `AGENTS.md` and `.beads/PRIME.md`.
- **Integrity**: Ensures architectural consistency throughout the development lifecycle.

## Success Criteria

- The operational loop in `AGENTS.md` is updated to 9 steps.
- The pre-close checklist in `PRIME.md` includes an "Alignment Audit."
- Every agent session begins with a mandatory check of the `openspec/changes/` directory.
