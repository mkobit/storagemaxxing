## Context

Previous security designs relied on "Agentic Nudges" (e.g., Prime Directives in `AGENTS.md`) which do not provide a physical security boundary. We are moving to **Hard Isolation** using the CLI Wrapper Pattern.

## Goals / Non-Goals

**Goals:**
- Enforce a physical filesystem and network boundary for all agent execution.
- Preserve developer ergonomics (access to `.gitconfig`, aliases).
- Securely forward SSH and GPG identities via sockets (No private keys in sandbox).
- Unify the sandboxing experience across Claude, Gemini, and Opencode.

**Non-Goals:**
- Perfect kernel-level isolation against 0-day escapes (Docker/bwrap is the target).
- Virtualizing the entire OS (only project-relevant paths are exposed).

## Decisions

### 1. The CLI Wrapper Pattern (The Harness)
All agents MUST be invoked via project-local wrappers in `bin/`. These wrappers are the "Harness" that sets up the sandbox before the agent starts.

```ascii
User -> bin/gemini -> [bwrap/docker jail] -> gemini-cli
User -> bin/claude -> [bwrap/docker jail] -> claude
```

### 2. Isolation Mechanism: Docker vs. OS-Native (bwrap)
We support two primary providers to balance isolation and performance:

- **Option A: Container-Based (Docker)**
  - Hard kernel boundary.
  - Requires explicit bind-mounts for `.gitconfig` and sockets.
- **Option B: OS-Native (Bubblewrap/bwrap)**
  - Lower overhead, high ergonomics.
  - Easier access to host binaries (e.g., the correct version of `bun`).
  - Mandatory for environments where Docker is restricted.

### 3. Secure Credential Bridge (Socket Forwarding)
Private keys (`~/.ssh/id_rsa`, etc.) MUST NEVER be visible inside the jail. Instead:
- **SSH**: The host `$SSH_AUTH_SOCK` is bind-mounted into the sandbox.
- **GPG**: The host `gpg-agent` socket is bind-mounted.
- **Result**: The agent can sign git commits and push to remotes, but `cat ~/.ssh/id_rsa` will fail.

### 4. Hook-Based Enforcement
Agents will detect their execution environment via a `SessionStart` hook.

```json
// Example .gemini/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "bin/validate-sandbox",
        "type": "command"
      }
    ]
  }
}
```
If `bin/validate-sandbox` fails (detects host execution), the agent session is terminated.

## Risks / Trade-offs

- **[Risk]**: Over-isolation breaks tool functionality (e.g., missing libs).
- **[Mitigation]**: The `bin/sandbox` wrapper will support an "allowlist" for system paths (`/usr`, `/lib`).
- **[Risk]**: Credential sockets are still powerful if hijacked.
- **[Mitigation]**: Sockets only allow signing, not extraction. The agent has "identity" but not "ownership" of the keys.
- **[Trade-off]**: Docker images need to be kept in sync with host tooling.
- **[Mitigation]**: Prefer `bwrap` for local dev to reuse host binaries while maintaining path isolation.
