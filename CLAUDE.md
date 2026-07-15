@AGENTS.md

> ⚠️ **Do not blindly run `bd setup claude` to clear a "stale" warning.** The Session Completion block below was hand-patched (sm-94br) to require a feature branch + PR instead of a direct `git push`, because `main` is branch-protected (GH013). Regenerating reverts that patch. If `bd setup claude --check` reports stale, diff the output first and re-apply the branch+PR requirement to `CRITICAL RULES` if the regen wipes it. Tracked in sm-sws7.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
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
