## ADDED Requirements

### Requirement: Local Workspace Jail
Local agents (Ollama, Opencode) SHALL be restricted to the workspace root and MUST NOT access files outside this boundary.

### Technical Implementation (OS-Level)

To enforce the local workspace jail for agents like Ollama or Opencode, the following OS-level mechanisms are recommended:

1. **Bubblewrap (Unprivileged)**: 
   - Recommended for local dev environments where root access is not desired.
   - Use `bwrap` to create a mount namespace where only the workspace root and necessary system paths are visible.
   - Example command: `bwrap --ro-bind /usr /usr --ro-bind /lib /lib --ro-bind /lib64 /lib64 --bind /home/mkobit/workspace/mkobit/storagemaxxing /home/mkobit/workspace/mkobit/storagemaxxing --dev /dev --unshare-all --proc /proc <agent-command>`

2. **Systemd Sandboxing**:
   - For agents running as persistent services.
   - Use `RootDirectory=/home/mkobit/workspace/mkobit/storagemaxxing` or `BindPaths=/home/mkobit/workspace/mkobit/storagemaxxing`.
   - Set `ProtectSystem=strict` and `ProtectHome=yes` to further isolate.

3. **Dedicated Linux User**:
   - The simplest method: run the agent under a specific user (e.g., `agent-sandbox`) with permissions restricted to the workspace directory.

4. **AppArmor Profile**:
   - Path-based enforcement that blocks access to sensitive files (e.g., `~/.ssh`, `/etc/passwd`) regardless of the user running the process.

#### Scenario: Unauthorized file access
- **WHEN** a local agent attempts to read `/etc/passwd` or any file outside the repository root
- **THEN** the execution environment MUST intercept and block the request, or the agent's internal "Prime" directive MUST prevent the action.

