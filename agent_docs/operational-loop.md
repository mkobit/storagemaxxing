# Operational Loop

All agents MUST coordinate using **Beads** (Execution/Tasking). The session RESUME → TRIAGE → CLAIM → EXECUTE → CLOSE loop lives in **[.beads/PRIME.md](../.beads/PRIME.md)** (auto-loaded via `bd prime` each session); this section covers only what that loop doesn't:

## Operational Rules

- Never modify a file unless you own the claim on its Bead.
- If working on `apps/web`, run `bun run dev` then `bun run screenshot` for a baseline before touching anything.
- **Commit immediately after every closed Bead, one bead per commit:** `git add <changed files> && git commit -m "task(<id>): <description>"`.
- **Before ending a session, reflect on the workflow itself (mandatory).**
  Record friction as a Meta bead (`bd create "Meta: <insight>" -t task -p 3 -l meta:beads-flow`) or `bd remember "<insight>"` for transient tips.

## Bead Task Contract

Every implementation Bead MUST satisfy this contract before an agent claims it:

- Names exactly one package (or `apps/web`) in a `scope:` label.
- Carries an acceptance criterion runnable as a command (test, lint, or typecheck invocation).
- If the acceptance criterion greps/scopes removal of hardcoded literals (e.g. hex colors) in named files: confirm each named file is actually imported/rendered before scoping the migration to it — a file with zero importers is dead code and belongs in a separate triage bead, not folded into the migration — and explicitly list any literal values intentionally excluded from the check (domain/categorical data, test fixtures) so they aren't ambiguously in-scope.

If a Bead cannot meet the contract, re-scope it or flag it with `bd human <id>` instead of claiming it.
If you cannot finish a claimed Bead, leave it `open` with a comment so another agent can resume.
