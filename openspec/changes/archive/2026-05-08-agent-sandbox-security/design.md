## Context

Our multi-agent environment is hybrid:

- **Cloud-Hosted (Claude, Gemini)**: Built-in sandboxing for tool execution.
- **Remote-Isolated (Jules)**: Physically separate, communicating via git/api.
- **Local-Resident (Ollama, Opencode)**: Running directly on the host, requiring strict local guardrails.

This design moves from "Manual Regex" to "Platform Policy Alignment" and defines the "Sync Protocol" to handle state consistency across these environments.

## Goals / Non-Goals

**Goals:**

- Leverage platform-native sandboxing (Claude/Gemini) where available.
- Enforce strict workspace boundaries for local agents (Ollama/Opencode).
- Minimize sync overhead for remote agents (Jules) by defining clear "Check-in/Check-out" points.

**Non-Goals:**

- Creating a unified "Agent OS."
- Redundant sandboxing of already-sandboxed cloud tools.

## Decisions

### 1. Platform-Specific Security Profiles

- **Gemini/Claude**: Rely on native `sandbox` tools for FS/Network. Use `AGENTS.md` to nudge them toward project-specific pathing.
- **Jules**: Since Jules is remote, "Security" is handled at the **Merge/Review** level. Jules must submit changes that are then validated by the local build.
- **Ollama/Opencode**: These agents must be "Jailed" to the workspace root using the agentic "Prime" (self-monitoring) and, if possible, OS-level execution restrictions (e.g., specific user account).

### 2. State Sync Protocol (The "Blackboard" Handshake)

To manage sync overhead, agents must follow the **Refresh-Before-Read** rule:

1.  **START**: Agent pulls latest state (`git pull` or `bd sync`).
2.  **LOCK**: Agent claims a bead (`bd update <id> --claim`).
3.  **WORK**: Agent executes in its native sandbox (Cloud, Remote, or Local).
4.  **COMMIT**: Agent writes result back to the filesystem.
5.  **UNLOCK**: Agent releases bead and pushes/syncs.

### 3. MCP & Sockets in a Hybrid World

- **Cloud Agents**: Use MCP via the hosted provider.
- **Local Agents**: Use MCP via local sockets (`stdio` or `http`).
- **Rule**: All local MCP servers MUST be bound to `localhost` and restricted to the `storagemaxxing` workspace directory.

## Risks / Trade-offs

- **[Risk]**: Conflict between remote Jules and local Opencode on the same file.
- **[Mitigation]**: Beads' lock-based state (`--claim`) is the source of truth. Agents MUST NOT touch a file unless they own the claiming bead.
- **[Trade-off]**: Frequent git/beads syncing adds latency.
- **[Mitigation]**: Agents only sync on "Session Boundary" (Start/End), not on every tool call.
