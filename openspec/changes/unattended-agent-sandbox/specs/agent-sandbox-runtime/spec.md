## ADDED Requirements

### Requirement: Workspace-Root Isolation

An unattended Claude Code session SHALL run inside a container whose filesystem view is limited to the `storagemaxxing` workspace root — no sibling repositories, no `$HOME` outside what the container explicitly provisions, and no host credential directories (`~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.config/gcloud`, etc.) are bind-mounted.

#### Scenario: Session attempts to read outside the workspace

- **WHEN** a tool call inside the sandboxed session attempts to read or write a path outside the `storagemaxxing` bind-mount (e.g. a sibling repo under `/home/mkobit/workspace/mkobit/`, or the host user's `$HOME`)
- **THEN** the filesystem operation MUST fail because the path does not exist inside the container, not merely because a policy rule denied it.

#### Scenario: Session attempts to reach a host credential

- **WHEN** a tool call inside the sandboxed session attempts to read `~/.ssh/id_*`, `~/.gnupg/*`, or another host credential path
- **THEN** the read MUST fail because no host credential directory is mounted into the container.

### Requirement: Scoped Toolchain Bootstrap

The sandbox container SHALL provision its toolchain (bun, bd) via the repo's existing `mise.toml` pins, matching the pattern already used by `.jules/env_setup.sh`, rather than a separately maintained version pin.

#### Scenario: Container starts a session

- **WHEN** the sandbox container starts a new unattended session
- **THEN** it MUST install and activate `mise` and run `mise install` against the committed `mise.toml` before invoking `bun` or `bd`, so the container's tool versions match CI's.

### Requirement: Network Egress Allowlist

The sandbox container SHALL restrict outbound network access to an explicit allowlist (GitHub git/API endpoints and the package registry `bun install` resolves against) and SHALL block or disable general-purpose web fetch/search tools during unattended sessions.

#### Scenario: Session attempts an unlisted network call

- **WHEN** a tool call inside the sandboxed session attempts to reach a host not on the network allowlist
- **THEN** the connection MUST be refused at the container network layer, independent of whether any agent-side tool policy also denies it.

### Requirement: Session-Scoped bd Sync

The sandbox container SHALL run `bd` in `--sandbox` mode (Dolt auto-push disabled) for the duration of the session and SHALL perform exactly one explicit `bd dolt push` as the final step before the session ends, mirroring the "push once, at the end" rule already documented for Jules dispatch.

#### Scenario: Session completes normally

- **WHEN** an unattended session finishes its work (PR opened or comment posted)
- **THEN** the session MUST run `bd dolt push` as its last `bd`-related action so claims, comments, and closes made during the session become visible outside the container.
