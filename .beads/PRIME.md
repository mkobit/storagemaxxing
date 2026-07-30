# Storagemaxxing | Beads Workflow

> **Context**: Managed by **Beads (bd)**. Run `bd prime` to reload this context.

## 🚨 SESSION CLOSE PROTOCOL

Before finishing, you MUST run this checklist:

1. **Validate:** `bun run lint` && `bun run typecheck` && `bun test`
2. **Alignment:** Ensure all implemented logic is reflected in the canonical OpenSpec `design.md` or `specs/`.
3. **Meta-Reflection:** Record at least one process learning or friction point as a `meta:beads-flow` bead or via `bd remember`.
4. **Issue Sync:** `bd close <ids>` for completed work.
5. **Git Sync:** `git add .` && `git commit -m "..."` -- `main` is branch-protected (GH013), so push a feature branch (`git push -u origin <topic-branch>`) and `gh pr create --fill` instead of pushing to main directly

## 🟢 AGENT OPERATIONAL LOOP

Automated agents MUST follow the **Spec-Driven Execution** model:

1. **RESUME:**
   - Run `bd recall` or `bd memories` to check for shared operational context from other agents.
   - Run `bunx openspec list --json` to find changes with `status: "in-progress"`.
   - For each active change, run `bunx openspec status --change <name> --json` to locate its `design.md` and `tasks.md`.
   - If a change is active but its tasks aren't in Beads, run `bd mol pour openspec-sync --var change_name=<name>`. This will parse the checkboxes in `tasks.md` into linked Beads issues.
2. **TRIAGE:** Use `bd ready` or `bd query "meta:openspec:<name>"` to find your next task.
   - **Checkpoints**: If a design is complete but hasn't been reviewed, mark the bead as `status:blocked` (blocked on human) with the label `status:needs-review` and PAUSE.
3. **CLAIM:** `bd update <id> --claim` to signal you are working, then immediately `git checkout -b <topic-branch>` if still on `main` -- do this before the first edit, not after `git-commit-main-guard` blocks the first commit.
4. **EXECUTE:** Implement focused changes following "Engineering Rails".
5. **FLOWBACK:** If the implementation deviates from the spec, you MUST update `design.md` or `tasks.md` in OpenSpec **FIRST**.
6. **CLOSE:** Mark the task checkbox in OpenSpec `tasks.md` and run `bd close <id> --reason "..."`.

## 🧪 WORK FORMULAS (`bd mol`)

Use these templates to bootstrap new feature probes and implementation syncs:

- `bd mol pour feature-probe --var system_name=<name>` - Scoping and architectural discovery via OpenSpec.
- `bd mol pour openspec-sync --var change_name=<name>` - Hydrate task graph from OpenSpec design.
- `bd mol pour design-adversary --var change_name=<name>` - Adversarial review of an existing design.
- `bd mol pour engineering-sync` - Sync Engineering Standards from OpenSpec to Beads.
- `bd mol pour autonomous-patrol --var agent_id=<jules|opencode> --var duty_name=<name>` - Recurring duty for autonomous agents.

Run `bd formula list` for the current, authoritative set -- this list drifts as formulas are added/removed.

## 🛠 ESSENTIAL COMMANDS

- `bd ready` - Show work ready for execution.
- `bd mol pour <formula>` - Bootstrap a new workflow.
- `bd update <id> --claim` - Start work on a bead.
- `bd close <ids> --reason "..."` - Complete work.
- `bd query "label=..."` - Filter by taxonomy.

## ⚠️ KNOWN GOTCHAS

- **`bd create --deps blocks:X` inverts the intuitive direction.** It makes the _new_ issue block `X` (so `X` ends up depending on the new issue) -- not "new issue depends on X". When hydrating an ordered task chain from an OpenSpec `tasks.md` (earlier task should block later task), this reads backwards and silently inverts the whole chain. Prefer `bd dep add <A> <B>` per edge instead (unambiguous positional semantics: `A` depends on `B`). Either way, verify the chain with `bd ready` or `bd show <id>`'s DEPENDS ON/BLOCKS sections before marking anything `status:needs-review` or handing off -- `bd lint` does not catch inverted edges.
- **`bd bootstrap --yes`/`--dry-run` errors on a repo that's already initialized.** With `sync.remote` set in `config.yaml` (this repo has it), bootstrap unconditionally plans "clone from remote" even when a local embedded Dolt DB already exists, and fails with `Error 1007: can't create database storagemaxxing; database exists` -- confirmed on bd 1.1.0, tracked as sm-39kn (not filed upstream by choice). Bootstrap is only for a fresh clone with no `.beads/embeddeddolt/` yet. If the DB already exists, use `bd dolt pull` to sync instead -- do not re-run bootstrap.
- **A scoping/design Agent (Fable-tier or otherwise) can crash mid-task with "You've hit your session limit."** This is a shared subagent quota across all Agent-tool spawns, not a Fable-specific limit -- confirmed after it hit twice in one session plus an unrelated forked background task (sm-csu4/sm-xlho, sm-ab89). Default: do NOT wait for the reset window and do NOT re-ask the user each time -- the calling session (whatever model it's running as) completes the remaining scoping artifacts itself and proceeds. Only re-raise this with the user if the fallback quality seems compromised (e.g. the crashed agent left inconsistent partial state), not merely because a crash occurred.
- **`bd show <id> --json` returns a single-element JSON array (`[{...}]`), not a bare object.** A script that does `JSON.parse(output)` and then reads `.status`/etc. directly off the parsed value will silently get `undefined` for every field -- no error, no crash, just a lookup that always fails. This bit `scripts/check-tasks-consistency.ts`: its `beadStatus()` helper checked `"status" in parsed` against the array, which is always false, so `bun run check:tasks` reported zero mismatches unconditionally from the day it was written, regardless of actual state (fixed in sm-aelz/sm-t17g). Always unwrap the array (`Array.isArray(parsed) ? parsed[0] : parsed`) before reading fields off `bd show --json` output.
- **A multi-pathspec `git add fileA fileB fileC` aborts entirely if even one pathspec fails to match** (e.g. a file already `git rm`'d earlier in the session) -- `fatal: pathspec 'fileC' did not match any files`, and none of fileA/fileB get staged either, not just the bad one. Don't assume partial success from a multi-path `git add` that errors. Always run `git status --porcelain` right after to confirm the intended staged set before committing (sm-4qwf: this landed a commit missing several changed files, leaving `HEAD` briefly broken until caught two commits later).
- **`bd create ... --parent <id>` can fail hierarchical child-ID generation** with `prefix mismatch: database uses storagemaxxing- but ID <id>.1 doesn't match (use --force to override)`, even though `bd config get prefix` correctly reports `sm` and every existing issue uses that short prefix -- the auto-generated child ID gets checked against the raw database name instead. Reproduced repeatedly on bd 1.1.0 (sm-b1tj), unfixed upstream. Workaround: create the child issue flat (no `--parent`), then `bd update <child-id> --parent <id>` as a second step.
- **A typo'd `bd close <id> --reason "..."` can't be corrected in place.** `bd update` has no `--reason` flag, and re-running `bd close` on an already-closed issue isn't a supported way to overwrite it. The only recovery is `bd update <id> --append-notes "..."`, which leaves the original wrong text still visible in `bd show`'s "Close reason:" field alongside the correction (sm-lid6). Get the reason right the first time -- proofread before running `bd close`.
- **The `git-commit-main-guard` PreToolUse hook (`.agents/hooks/git-commit-main-guard.ts`) used to match the raw Bash command _string_, not an actual git invocation** -- any command whose text merely contained "git" and "commit" adjacently inside a quoted `bd close --reason`/`--description` string (describing the guard, not running it) got blocked with a misleading branch-protection error. Hit repeatedly while filing beads about this exact hook. Fixed in sm-brim by stripping quoted spans before matching; if a false-positive resurfaces, check whether the trigger text is _unquoted_ (the fix only handles quoted spans).
