# Storagemaxxing | Beads Workflow

> **Context**: Managed by **Beads (bd)**. Run `bd prime` to reload this context.

## 🚨 SESSION CLOSE PROTOCOL
Before finishing, you MUST run this checklist:
1. **Validate:** `bun run lint` && `bun run typecheck` && `bun test`
2. **Issue Sync:** `bd close <ids>` for completed work.
3. **Git Sync:** `git add .` && `git commit -m "..."` && `git push`

## 🟢 AGENT OPERATIONAL LOOP
Automated agents MUST follow the **Agentic Prime** ([AGENTS.md](../AGENTS.md)):

1. **RESUME:** Run `bd prime` and **immediately check `openspec/changes/`** for any `active` designs or pending `tasks.md` that haven't been hydrated.
2. **SYNC:** If a task has `type:sync`, you MUST hydrate it using the **Sync Handshake** before proceeding.
3. **TRIAGE:** Scan `bd ready` for unclaimed tasks.
4. **CLAIM:** `bd update <id> --claim` to signal you are working.
5. **EXECUTE:** Follow "Engineering Rails" (Functional, Immutable, Strict).
6. **CLOSE:** `bd close <ids>` with a summary and link to the relevant OpenSpec change.

## 🧪 WORK FORMULAS (`bd mol`)
Use these templates to bootstrap new feature probes and implementation syncs:
- `bd mol pour feature-probe --var system_name=<name>` - Scoping and architectural discovery via OpenSpec.
- `bd mol pour openspec-sync --var change_name=<name>` - Hydrate task graph from OpenSpec design.
- `bd mol pour backlog-hygiene` - Periodic maintenance of the issue database.

## 🛠 ESSENTIAL COMMANDS
- `bd ready` - Show work ready for execution.
- `bd mol pour <formula>` - Bootstrap a new workflow.
- `bd update <id> --claim` - Start work on a bead.
- `bd close <ids> --reason "..."` - Complete work.
- `bd query "label=..."` - Filter by taxonomy.
