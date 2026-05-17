## Why

As we operate across cloud-hosted agents (Gemini, Claude), remote autonomous agents (Jules), and local agents (Opencode), we face a critical security risk: agents executing on the host machine have access to sensitive user data, SSH keys, and system files. Previous "nudge-based" security (instructing the agent to stay in the project) is insufficient. We need a physical, environment-enforced boundary that provides hard isolation while maintaining developer ergonomics (access to git, ssh, and shell configs).

## What Changes

- **CLI Wrapper Pattern**: Implement project-local wrappers for all agent CLIs (e.g., `bin/gemini`, `bin/claude`, `bin/opencode`) that automatically launch the agent inside a `bwrap` (Linux) or `docker` sandbox.
- **Hard isolation**: Use OS-level primitives (namespaces/MicroVMs) to restrict filesystem visibility to the project root and a subset of benign system paths.
- **Secure Credential Forwarding**: Forward host sockets (SSH agent, GPG agent) and benign configurations (`.gitconfig`) into the sandbox, allowing agents to perform authenticated Git operations without ever "seeing" or being able to read private key material.
- **Hook-Based Enforcement**: Configure agent runners to detect if they are running "bare" on the host and automatically terminate if the sandbox is not active.

## Capabilities

### New Capabilities
- `hard-execution-jail`: Physical isolation for all agent tool calls.
- `secure-credential-bridge`: Zero-exposure forwarding for SSH and GPG identities.
- `sandbox-enforcement-hooks`: Automated session termination for un-sandboxed environments.

## Impact

- **Configuration**: Standardized `bin/` wrappers and updated `.gemini/settings.json`, `.claude/settings.json`.
- **Workflow**: Developers invoke agents via `bin/<agent>` instead of global binaries.
- **Security**: Complete prevention of path traversal attacks and private key theft.

## Success Criteria

- Any attempt by an agent to read `~/.ssh/id_rsa` or `/etc/passwd` results in a hard OS error (File Not Found / Permission Denied).
- Agents can successfully run `git push` and sign commits without the sandbox having access to private key files.
- Agent sessions fail to start if invoked outside the project-defined sandbox.
