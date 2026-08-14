# Operational Loop (Spec-Driven & Bidirectional)

All agents MUST coordinate using **OpenSpec** (Design/Contract) and **Beads** (Execution/Tasking) — OpenSpec is the source of truth, Beads is the engine. The session RESUME → TRIAGE → CLAIM → EXECUTE → CLOSE loop lives in **[.beads/PRIME.md](../.beads/PRIME.md)** (auto-loaded via `bd prime` each session); this section covers only what that loop doesn't:

## OpenSpec vs Bead-Only Decision Rule

- **OpenSpec + Beads:** Required for non-trivial features, architectural changes, schema updates, cross-package changes, or multi-step design updates that alter system behavior or public API contracts.
  Before coding, an OpenSpec `design.md`/`tasks.md` must exist and be synced to Beads via `bd mol pour openspec-sync`.
  A design awaiting human review blocks implementation (`status:needs-review`).
- **Bead-only:** Permitted for localized bug fixes, single-package chores, documentation updates, operational/meta tasks, or refactorings that preserve existing spec contracts without altering system topology or schemas.

## Operational Rules

- Never modify a file unless you own the claim on its Bead.
- If working on `apps/web`, run `bun run dev` then `bun run screenshot` for a baseline before touching anything.
- **Never edit canonical `openspec/specs/**/spec.md` files directly** — they're derived from a change's delta by `bunx openspec archive`.
  CI fails a PR that touches both `openspec/specs/` and an active change's `specs/`.
- **Commit immediately after every closed Bead, one bead per commit:** `git add <changed files> && git commit -m "task(<id>): <description>"`.
- Run `bunx openspec archive` only after all linked Beads are closed.
- **Before ending a session, reflect on the workflow itself (mandatory).**
  Record friction as a Meta bead (`bd create "Meta: <insight>" -t task -p 3 -l meta:beads-flow`) or `bd remember "<insight>"` for transient tips.

See **[openspec/config.yaml](../openspec/config.yaml)** for schema-specific rules.

## Bead Task Contract

Every implementation Bead MUST satisfy this contract before an agent claims it:

- Names exactly one package (or `apps/web`) in a `scope:` label.
- References the OpenSpec spec requirement it implements.
- Carries an acceptance criterion runnable as a command (test, lint, or typecheck invocation).
- If the acceptance criterion greps/scopes removal of hardcoded literals (e.g. hex colors) in named files: confirm each named file is actually imported/rendered before scoping the migration to it — a file with zero importers is dead code and belongs in a separate triage bead, not folded into the migration — and explicitly list any literal values intentionally excluded from the check (domain/categorical data, test fixtures) so they aren't ambiguously in-scope.

If a Bead cannot meet the contract, re-scope it or flag it with `bd human <id>` instead of claiming it.
If you cannot finish a claimed Bead, leave it `open` with a comment linking the relevant OpenSpec change so another agent can resume.
