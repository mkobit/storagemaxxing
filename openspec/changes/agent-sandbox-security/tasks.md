<!--
  IMPORTANT: After creating this file, you MUST hydrate it into Beads:
  bd mol pour openspec-sync --var change_name=agent-sandbox-security
-->

## 1. Hard Isolation Infrastructure (CLI Wrappers)

- [ ] 1.1 **Universal Sandbox Wrapper**: Create `bin/sandbox` using `bwrap` (Linux) that creates a restricted namespace with project-root write access and SSH/GPG socket forwarding.
  - **Validation**: `bin/sandbox cat /etc/passwd` fails; `bin/sandbox git push` succeeds.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`
- [ ] 1.2 **Docker Provider**: Develop a `Dockerfile.agent` that provides a mirrored execution environment for agents, including necessary host config mounts.
  - **Validation**: `docker build -t agent-sandbox -f Dockerfile.agent .` succeeds.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`
- [ ] 1.3 **Agent-Specific Wrappers**: Implement `bin/gemini`, `bin/claude`, and `bin/opencode` that invoke their respective global binaries through `bin/sandbox`.
  - **Validation**: Running `bin/gemini --help` works correctly but runs within the restricted namespace.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`

## 2. Secure Credential Forwarding

- [ ] 2.1 **SSH Agent Bridge**: Update `bin/sandbox` to automatically detect and bind-mount the host's `$SSH_AUTH_SOCK` into the jail.
  - **Validation**: `bin/sandbox ssh-add -l` shows the host's keys within the jail.
  - **Labels**: `scope:infra`, `type:feature`, `meta:security`
- [ ] 2.2 **GPG Agent Bridge**: Update `bin/sandbox` to bind-mount the `gpg-agent` socket and set `GPG_TTY`.
  - **Validation**: `bin/sandbox git commit -S` signs the commit using the host's GPG identity.
  - **Labels**: `scope:infra`, `type:feature`, `meta:security`
- [ ] 2.3 **User Config Mapping**: Implement read-only mounting of `~/.gitconfig` into the sandbox.
  - **Validation**: `bin/sandbox git config user.name` returns the user's host name.
  - **Labels**: `scope:infra`, `type:feature`, `meta:security`

## 3. Enforcement & Hook Integration

- [ ] 3.1 **Sandbox Detection Hook**: Create `bin/validate-sandbox`, a lightweight script that returns 0 if running inside the sandbox and 1 otherwise.
  - **Validation**: Script returns 1 on host, 0 when run via `bin/sandbox`.
  - **Labels**: `scope:infra`, `type:feature`, `meta:security`
- [ ] 3.2 **Gemini/Claude Integration**: Update `.gemini/settings.json` and `.claude/settings.json` to use `bin/validate-sandbox` in the `SessionStart` hook.
  - **Validation**: Agent session fails to start if not invoked via the project-local wrapper.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`

## 4. Adversarial Audit & Verification

- [ ] 4.1 **Credential Leak Spike**: Attempt to have an agent read its own forwarded socket to extract private keys.
  - **Validation**: Confirm sockets only allow signing operations and do not reveal key material.
  - **Labels**: `scope:infra`, `type:research`, `meta:security`
- [ ] 4.2 **Bypass Simulation**: Attempt to invoke the global `gemini-cli` directly and verify the `SessionStart` hook correctly blocks execution.
  - **Validation**: Explicit "Security Violation" error message and session termination.
  - **Labels**: `scope:infra`, `type:research`, `meta:security`
