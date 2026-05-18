## Why

As we operate across cloud-hosted agents (Gemini, Claude), remote autonomous agents (Jules), and local agents (Ollama, Opencode), we face a dual challenge: (1) ensuring system safety in local/un-sandboxed environments and (2) managing the synchronization overhead of state (Beads, OpenSpec) across these disparate execution contexts.

## What Changes

- Establish **Hybrid Sandbox Alignment**: Acknowledge built-in cloud sandboxes while enforcing strict local boundaries for Ollama and Opencode.
- Define the **State Sync Protocol**: Rules for how remote agents (Jules) and local agents (Opencode) commit and pull from the "Blackboard" (Beads/OpenSpec).
- Implement **Permission Tiers** that adapt based on the agent's hosting environment (Remote vs. Cloud vs. Local).

## Capabilities

### New Capabilities

- `hybrid-sandbox-policy`: Unified security rules that respect platform-native sandboxes.
- `state-sync-protocol`: Mechanisms for managing sync overhead and state consistency across environments.
- `local-boundary-enforcement`: Specific guardrails for un-sandboxed local agents like Ollama.

## Impact

- **Configuration**: Specific security profiles for `.opencode/`, `.claude/`, and `.gemini/`.
- **Workflow**: Agents must include "Sync Awareness" in their operational loop (e.g., pulling latest Beads state before starting).
- **Audit**: Every action must be attributed to an agent and its execution environment.

## Success Criteria

- Local agents (Ollama/Opencode) are restricted to the workspace root using native platform controls or agentic "Prime" nudges.
- The "Blackboard" state remains consistent even when multiple agents are active across different environments.
- Synchronization overhead is minimized through efficient Beads/OpenSpec polling logic.
