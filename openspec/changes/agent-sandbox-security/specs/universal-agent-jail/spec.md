## ADDED Requirements

### Requirement: Unified Sandbox Configuration
The project SHALL maintain a single source of truth for agent execution boundaries to ensure consistency across cloud, remote, and local agents.

### The "Universal Agent Jail" (UAJ) Pattern

The UAJ pattern follows the **Trusted Harness / Isolated Compute** model:

1.  **Harness (Agent Runner)**: Responsible for orchestrating the LLM, parsing tool calls, and enforcing high-level policies (e.g., Bead claiming).
2.  **Compute (Sandbox Environment)**: An isolated environment where the actual code execution or file operations happen.

#### Manifest Definition (`.sandbox.yaml`)

All agent runners SHOULD ideally respect a manifest at the project root:

```yaml
# Proposed Universal Sandbox Manifest
version: 1.0
metadata:
  project: storagemaxxing
  root: /home/mkobit/workspace/mkobit/storagemaxxing

boundaries:
  filesystem:
    allow:
      - "${project.root}"
      - "/tmp/agent-scratchpad"
    block:
      - "~/.ssh"
      - "~/.aws"
      - "/etc/passwd"
      - "${project.root}/.env"
  network:
    localhost: allowed
    external: blocked
    whitelist:
      - "github.com"
      - "api.anthropic.com"
      - "generativelanguage.googleapis.com"
  tools:
    allowed: [bun, git, bd, openspec, rg, fd]
    restricted: [curl, wget, ssh, sudo]
```

#### Mapping to Agents

| Agent | Harness Implementation | Compute Sandbox |
| :--- | :--- | :--- |
| **Gemini CLI** | `gemini-cli` binary | `docker`, `runsc` (gVisor), or `sandbox-exec` |
| **Claude Code** | `claude` binary | `srt` (Sandbox Runtime) or `docker` |
| **Opencode** | Local runner script | `bubblewrap` (bwrap) or `systemd-run` |
| **Jules** | Autonomous service | Physically isolated Remote VM |

### Generalization Strategy for Opencode/Ollama

To generalize the UAJ pattern for un-sandboxed local tools:

1.  **Wrappers**: Create a standard `bin/jail` wrapper that uses `bubblewrap` to enforce the `.sandbox.yaml` boundaries.
2.  **Prime Enforcement**: If OS-level jailing is unavailable, the "Prime Directive" (nudge) must be calibrated with the exact same paths defined in `.sandbox.yaml`.
3.  **Audit Attribution**: Every tool call must be logged with the agent's identity and the sandbox provider used (e.g., `provider:bwrap`, `provider:srt`).

#### Scenario: Unified path enforcement
- **WHEN** any agent (Cloud or Local) attempts to access a path
- **THEN** it MUST be validated against the `boundaries.filesystem` rules in `.sandbox.yaml`.
