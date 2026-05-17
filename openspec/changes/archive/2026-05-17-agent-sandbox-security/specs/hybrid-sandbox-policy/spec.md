## ADDED Requirements

### Requirement: Platform Alignment
The system SHALL prioritize native platform sandboxing for Cloud-hosted agents (Claude, Gemini) while enforcing custom boundaries for local agents.

### Native Sandbox Audit

#### Google Gemini (API & CLI)
- **Code Execution**: Runs in a managed Python sandbox on Google's backend.
- **Filesystem**: Ephemeral and isolated. No access to the host's filesystem unless explicitly uploaded or via the Gemini CLI's expanded sandbox.
- **Network**: Outbound internet access is typically disabled.
- **CLI Capabilities**: Supports multiple backends: `docker`, `podman`, `sandbox-exec` (macOS), and `runsc` (gVisor).
- **Project Boundary**: The Gemini CLI uses a "Sandbox Expansion" request model to nudge agents toward project-root compliance.

#### Anthropic Claude (API & Analysis Tool)
- **Analysis Tool (Web)**: Runs JavaScript client-side in the browser. Isolation is provided by the browser's sandbox.
- **Code Execution (API)**: Uses the "Sandbox Runtime (srt)" or Docker-based containers.
- **Filesystem**: Restricted to specific directories using OS-level primitives (`sandbox-exec` or `bubblewrap`).
- **Network**: Proxy-based blocking of all non-approved outbound traffic.
- **Credential Protection**: Native protection to prevent sensitive keys (SSH/Git) from entering the tool environment.

### Workspace Strategy
We rely on these native sandboxes for tool execution but enforce the **Project Root Boundary** via the `Prime Directive` (nudge-based) to ensure agents do not attempt to traverse outside the `storagemaxxing` folder, even if the sandbox technically allows it (e.g., in local CLI configurations).

#### Scenario: Agent tool execution
- **WHEN** Gemini executes a tool in its native sandbox
- **THEN** it MUST adhere to the project's root workspace restrictions defined in `AGENTS.md`.

