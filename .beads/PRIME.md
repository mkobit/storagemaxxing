# Storagemaxxing | Beads Workflow

> **Context**: Managed by **Beads (bd)**. Run `bd prime` to reload this context.

## 🚨 SESSION CLOSE PROTOCOL
Before finishing, you MUST run this checklist:
1. **Validate:** `bun run lint` && `bun run typecheck` && `bun test`
2. **Issue Sync:** `bd close <ids>` for completed work.
3. **Beads Sync:** `bd dolt push`
4. **Git Sync:** `git add .` && `git commit -m "..."` && `git push`

## 🟢 AGENT OPERATIONAL LOOP
Automated agents should autonomously:
1. **Triage:** Scan `bd ready` and `bd stale`.
2. **Label:** Apply `scope:`, `domain:`, and `type:` tags per [.beads/TAGS.md](TAGS.md).
3. **Prune:** Defer or close issues that are no longer relevant.
4. **Link:** Explicitly `bd link` dependencies to prevent duplicate effort.

## 📖 REFERENCE
- **Tags & Taxonomy:** [.beads/TAGS.md](TAGS.md)
- **Architecture:** [AGENTS.md](AGENTS.md)
- **Product Specs:** [docs/jules/](docs/jules/)

## 🧪 WORK FORMULAS (`bd mol`)
Use these templates to spawn structured epics for common loops:
- `bd mol pour catalog-expansion --var system_name=<name>` - New storage system.
- `bd mol pour engine-feature-loop --var feature_name=<name>` - New packer/solver logic.
- `bd mol pour backlog-hygiene` - Periodic maintenance.

## 🛠 ESSENTIAL COMMANDS
- `bd ready` - Show unblocked work.
- `bd create -t <type> -p <0-4> -l <labels>` - New issue.
- `bd update <id> --claim` - Start work.
- `bd close <ids> --reason "..."` - Complete work.
- `bd dolt push/pull` - Sync task database.
