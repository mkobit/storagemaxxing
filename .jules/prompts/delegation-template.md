# Delegation Prompt Template

Use this skeleton when handing a delegate-ready bead to Jules, Gemma, or any low-capability runner.
Keep instructions loose on implementation specifics; give broad goals, philosophy, and completion checkboxes.

## Skeleton

```
You are picking up bead <bead-id> in the Storagemaxxing monorepo.

## Ground rules

- Read .jules/prompts/delegation-contract.md for the full contract.
- Confirm the sandbox starts clean: `git status --porcelain` MUST print nothing before you begin. If it doesn't, abort and post a `<!-- delegate-blocked -->` comment with the dirty paths.
- Run `bd update <bead-id> --claim` before any file edit or research output.
- Stay inside `scope:<package>` named on the bead.
- Path allowlist for `git add`: `packages/<scope>/**` only.
  For kind:research-readonly beads the allowlist is empty — do not `git add` anything.
- Before commit (impl) or before posting the output comment (research),
  run `git status --porcelain`. If any path falls outside the allowlist,
  ABORT and post a `<!-- delegate-blocked -->` comment naming the
  offending paths. Do not guess and do not commit drift.

## Goal

<one-paragraph plain-English goal, copied or paraphrased from the bead description>

## Completion checkboxes

- [ ] Sandbox confirmed clean (`git status --porcelain` is empty before starting)
- [ ] Bead claimed (`bd update <bead-id> --claim`)
- [ ] <concrete step 1, e.g. "Exports enumerated from packages/<X>/src">
- [ ] <concrete step 2, e.g. "Output posted as bead comment with marker `<!-- delegate-output -->`">
- [ ] Pre-commit/pre-comment diff check passed (allowlist holds)
- [ ] Acceptance command observed passing locally
- [ ] Bead closed (`bd close <bead-id> --reason "..."`)  *or* PR opened and linked in comment, per delegation-contract output channel

## What NOT to do

- Do not commit any path outside the allowlist, even if the sandbox bootstrap created it.
- Do not modify files outside `scope:<package>`.
- Do not edit OpenSpec under `openspec/` — flowback is reserved for Opus-class agents.
- Do not open issues, edit AGENTS.md, or touch lint/tsconfig.
- If the bead seems ambiguous, stop and comment on the bead with `<!-- delegate-blocked -->`. Do not guess.
```

## Per-recipient tuning

- **Jules** — Jules tolerates broader goal statements and prefers checkboxes. Keep the "What NOT to do" section verbatim; Jules has been observed wandering across packages when it is omitted.
- **Gemma / smaller local models** — Be more literal: list exact file paths, exact shell commands, exact comment markers. Drop the "philosophy" framing and replace it with a numbered procedure.

## Concurrency note

Before dispatching multiple beads in parallel, run `./.jules/delegate-slate.sh --json` to compute the current concurrency width and the dispatch slate (one bead per non-colliding scope).
Two runners claiming the same `scope:` at once will produce merge conflicts; the orchestrator is responsible for serializing same-scope beads.

## Dispatch defaults

```bash
# impl beads (kind:impl-mechanical, kind:impl-narrow)
jules session create --prompt "$PROMPT" --source mkobit/storagemaxxing \
  --branch main --auto-approve --auto-pr

# research beads (kind:research-readonly) — output is a bead comment, no PR
jules session create --prompt "$PROMPT" --source mkobit/storagemaxxing \
  --branch main --auto-approve --no-auto-pr
```

`--no-auto-approve` is reserved for validating a brand-new prompt template or a `mode:hotl` bead the operator wants to checkpoint at plan time.
