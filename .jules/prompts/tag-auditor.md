# Protocol: Tag Auditor

## Goal
Verify that all open Beads issues follow the taxonomy defined in `.beads/TAGS.md`.

## Frequency
Once per week.

## Step-by-Step Protocol
1. **Audit Taxonomy**: Read `.beads/TAGS.md`.
2. **Scan Issues**: Run `bd query "status=open"`.
3. **Correct Labels**: For each issue:
   - Ensure it has at least one `scope:` and one `type:` label.
   - If a `domain:` is missing but can be inferred (e.g., from the title "Gridfinity"), add it.
   - Use `bd label <id> <label>` to fix inaccuracies.

## Termination
Stop after auditing **1 or 2 issues** maximum. Jules is optimized for focused, single-task execution.
