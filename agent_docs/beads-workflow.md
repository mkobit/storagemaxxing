# Issue Tracking & Session Completion with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

## Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

## Quick Start

**Check for ready work:**

```bash
bd ready
```

**Create new issues:**

Always include `--validate` and `--acceptance` for task/feature/bug types:

```bash
bd create "Issue title" --description="Detailed context" -t task -p 2 --validate --acceptance "Given ..., when ..., then ..."
bd create "Issue title" --description="What this issue is about" -t bug -p 1 --validate --acceptance "Bug no longer reproduces" --deps discovered-from:bd-123
```

**Claim and update:**

```bash
bd update <id> --claim
bd update bd-42 --priority 1
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed"
```

## Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

## Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

## Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

## Quality & Lifecycle

- Use `--acceptance` and `--design` fields when creating issues.
- Use `--validate` to check description completeness.
- `bd defer <id>` / `bd supersede <id>` for issue management.
- `bd stale` / `bd orphans` / `bd lint` for hygiene.
- `bd human <id>` to flag for human decisions.
- `bd formula list` / `bd mol pour <name>` for structured workflows.

## Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history.
- Use `bd dolt push`/`bd dolt pull` for remote sync.
- No manual export/import needed!
- **Never commit `.beads/issues.jsonl`.** It is bd's auto-export backup and is gitignored. Dolt is the only sync channel — committing the jsonl pollutes unrelated PR diffs with bead-state churn and creates two competing sources of truth.

## Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Read plain bd output directly in interactive sessions; never pipe bd output into shell or script interpreters to extract fields
- ✅ Reserve `--json` for unattended automation (CI, hooks) that parses output programmatically
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Verify dependency direction with `bd dep tree <id>` immediately after running `bd dep add` or `bd create --deps`
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Before filing a new `human`-labeled bead, check open `human`-labeled beads sharing the same `domain:`/`scope:` labels first (`bd query "label=human AND label=domain:<x>"`) — a single dashboard/settings action can resolve more than one, and bundling them saves the human a repeat trip. See sm-zopp for the incident that prompted this rule; kept as a manual filing-time check rather than an automated `bd lint` rule since `bd`'s lint rule set isn't user-extensible.
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:f65d5d33 -->

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd lint       # MUST pass before pushing — fix any missing Acceptance Criteria
   bd dolt push
   git checkout -b <topic-branch>   # skip if already on a feature branch
   git push -u origin <topic-branch>
   gh pr create --fill
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- `main` is branch-protected (GH013: pull request required) - a direct `git push` to main is always rejected, even for tiny/doc-only changes
- Work is NOT complete until a feature branch is pushed and a PR against main is opened
- NEVER attempt a direct push to main as a shortcut - branch + PR is the required path, no exceptions
- NEVER stop before pushing the branch and opening the PR - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push the branch and open the PR
- If push or PR creation fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
