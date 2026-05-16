# Storagemaxxing | Beads Workflow

> **Context**: Managed by **Beads (bd)**. Run `bd prime` to reload this context.

## 🚨 SESSION CLOSE PROTOCOL
Before finishing, you MUST run this checklist:
1. **Validate:** `bun run lint` && `bun run typecheck` && `bun test`
2. **Alignment:** Ensure all implemented logic is reflected in the canonical OpenSpec `design.md` or `specs/`.
3. **Issue Sync:** `bd close <ids>` for completed work.
4. **Git Sync:** `git add .` && `git commit -m "..."` && `git push` (Crucial for multi-agent sync)

## 🟢 AGENT OPERATIONAL LOOP
Automated agents MUST follow the **Spec-Driven Execution** model:

1. **RESUME:** 
   - Run `bd recall` or `bd memories` to check for shared operational context from other agents.
   - Run `bunx openspec list --json` to find changes with `status: "in-progress"`.
   - For each active change, run `bunx openspec status --change <name> --json` to locate its `design.md` and `tasks.md`.
   - If a change is active but its tasks aren't in Beads, run `bd mol pour openspec-sync --var change_name=<name>`. This will parse the checkboxes in `tasks.md` into linked Beads issues.
2. **TRIAGE:** Use `bd ready` or `bd query "meta:openspec:<name>"` to find your next task.
   - **Checkpoints**: If a design is complete but hasn't been reviewed, mark the bead as `status:blocked` (blocked on human) with the label `status:needs-review` and PAUSE.
3. **CLAIM:** `bd update <id> --claim` to signal you are working.
4. **EXECUTE:** Implement focused changes following "Engineering Rails".
5. **FLOWBACK:** If the implementation deviates from the spec, you MUST update `design.md` or `tasks.md` in OpenSpec **FIRST**.
6. **CLOSE:** Mark the task checkbox in OpenSpec `tasks.md` and run `bd close <id> --reason "..."`.

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
