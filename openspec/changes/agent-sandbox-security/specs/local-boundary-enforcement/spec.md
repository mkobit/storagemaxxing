## ADDED Requirements

### Requirement: Local Workspace Jail
Local agents (Ollama, Opencode) SHALL be restricted to the workspace root and MUST NOT access files outside this boundary.

#### Scenario: Unauthorized file access
- **WHEN** a local agent attempts to read `/etc/passwd` or any file outside the repository root
- **THEN** the execution environment MUST intercept and block the request, or the agent's internal "Prime" directive MUST prevent the action.
