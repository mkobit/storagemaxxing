## Context

In a multi-agent system, the "State" is often fragmented across agent memory windows. This design centralizes the state into the filesystem using Beads and OpenSpec. It enforces a "Breadth of Rectangles" approach where agents build modular, 2D fitters before attempting complex 3D modeling or global solving.

## Goals / Non-Goals

**Goals:**

- Define a "Handshake Protocol" where Agent A can leave a Bead for Agent B.
- Enforce the "Breadth of Rectangles" philosophy programmatically.
- Ensure Jules (autonomous) and Gemini/Claude (guided) operate under the same architectural "Prime."

**Non-Goals:**

- Creating a centralized "Agent Manager" service (we use the filesystem).
- Defining specific domain logic for bins.

## Decisions

### 1. The Filesystem as the "Blackboard"

All agent coordination happens via:

- **Beads (`.beads/`)**: For task status, claims, and dependencies.
- **OpenSpec (`openspec/`)**: For design authority and architectural constraints.
- **Agent Context Files (`AGENTS.md`, etc.)**: For high-level operational rules.

### 2. Multi-Agent Handshake Loop

```
1. TRIAGE: Agent checks `bd ready` for unclaimed work.
2. SYNC: Agent reads `openspec/` for active changes and designs.
3. CLAIM: Agent runs `bd update <id> --claim` to signal it is working.
4. SPEC: If the task is complex, agent creates/updates an OpenSpec change.
5. EXECUTE: Agent implements code following "Engineering Rails."
6. VALIDATE: Agent runs `bun run lint && bun run typecheck && bun test`.
7. CLOSE: Agent runs `bd close <id>` and leaves a summary for the next agent.
```

### 3. "Breadth of Rectangles" Enforcement

Agents are explicitly forbidden from implementing 3D or WASM-based global solvers unless a specific OpenSpec "Architectural Exception" exists.

- **Rule**: Default to "Modular 2D Fitters" (Pure functions, 2D math).

## Risks / Trade-offs

- **[Risk]**: Agents might ignore `AGENTS.md`.
- **[Mitigation]**: We include the "Prime" in the hook contexts (`.claude/`, `.gemini/`) so it is injected into every session.
- **[Trade-off]**: Filesystem coordination is slower than a real-time message bus.
- **[Mitigation]**: It is more robust and "Agent-Native" (agents are good at reading files).
