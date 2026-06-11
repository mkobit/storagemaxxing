# state-sync-protocol Specification (Delta)

## REMOVED Requirements

### Requirement: Refresh-Before-Read

**Reason**: Sync-at-session-start lives in `AGENTS.md` ("SYNC & DISCOVER" and "Multi-Agent Sandbox & Sync").

### Requirement: Task Claiming (Locking)

**Reason**: Atomic claiming is enforced by `bd update --claim` tooling and documented in `AGENTS.md`.
