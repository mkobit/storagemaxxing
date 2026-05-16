## Why

We are operating in a multi-agent environment (Gemini CLI, Claude, Jules, and potentially others). To prevent chaos and architectural drift, we need an "Agentic Prime"—a self-bootstrapping set of instructions that defines how agents interact with each other, the tools (Beads, OpenSpec, Bun), and the codebase.

## What Changes

- Formalize the **Agentic Operational Loop** (Triage -> Spec -> Design -> Execute -> Validate).
- Define the **Handover Protocol** between agents using Beads and OpenSpec.
- Establish **Tool Authority**: Which tools own which part of the state (Beads owns tasks, OpenSpec owns design, Git owns source).

## Capabilities

### New Capabilities

- `agentic-prime`: The canonical instruction set for all AI agents in the monorepo.
- `cross-agent-handshake`: Protocols for one agent leaving context for the next via Beads/OpenSpec.
- `tool-governance`: Rules for using `bd`, `openspec`, `bun`, and `gh` programmatically.

## Impact

- **Files**: `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, and `.beads/PRIME.md`.
- **Workflow**: Agents will check the "Handshake State" before starting work to avoid duplicate or conflicting efforts.

## Success Criteria

- A unified `AGENTS.md` exists that all agents reference as their "Prime Directive."
- Beads formulas exist to automate the creation of OpenSpec-linked issues.
- All agents can successfully navigate the "Breadth of Rectangles" architecture without human intervention.
