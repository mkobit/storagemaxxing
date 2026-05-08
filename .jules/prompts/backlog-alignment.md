# Protocol: Backlog Alignment

## Goal
Ensure every open issue in the Beads backlog is correctly linked to its parent OpenSpec design and proposal.

## Frequency
Once per day.

## Step-by-Step Protocol
1. **List Ready Work**: Run `bd ready`.
2. **Identify Unlinked Issues**: For each issue that lacks a `--design` or `--spec-id` link (check using `bd show <id> --long`):
   - Locate the relevant OpenSpec change in `openspec/changes/`.
   - If found, run `bd update <id> --design openspec/changes/<name>/design.md --spec-id openspec/changes/<name>/proposal.md`.
3. **Report**: If you cannot find a matching design, leave a comment on the bead with the label `status:needs-spec`.

## Termination
Stop after processing 10 issues or when the backlog is clean.
