# Delegation Prompt Template

Use this skeleton when handing a delegate-ready bead to Jules, Gemma, or any low-capability runner.
Keep instructions loose on implementation specifics; give broad goals, philosophy, and completion checkboxes.

## Skeleton

```
You are picking up bead <bead-id> in the Storagemaxxing monorepo.

## Ground rules

- Read .jules/prompts/delegation-contract.md before touching anything.
- Run `bd update <bead-id> --claim` before any file edit or research output.
- Stay inside the `scope:<package>` named on the bead. Do not edit files in other packages.
- Run the acceptance command yourself and confirm it passes before declaring done.

## Goal

<one-paragraph plain-English goal, copied or paraphrased from the bead description>

## Completion checkboxes

- [ ] Bead claimed (`bd update <bead-id> --claim`)
- [ ] <concrete step 1, e.g. "Exports enumerated from packages/<X>/src">
- [ ] <concrete step 2, e.g. "Output posted as bead comment with marker `<!-- delegate-output -->`">
- [ ] Acceptance command observed passing locally
- [ ] Bead closed (`bd close <bead-id> --reason "..."`)  *or* PR opened and linked in comment, per delegation-contract output channel

## What NOT to do

- Do not modify files outside `scope:<package>`.
- Do not edit OpenSpec under `openspec/` — flowback is reserved for Opus-class agents.
- Do not open issues, edit AGENTS.md, or touch lint/tsconfig.
- If the bead seems ambiguous, stop and comment on the bead with `<!-- delegate-blocked -->`. Do not guess.
```

## Per-recipient tuning

- **Jules** — Jules tolerates broader goal statements and prefers checkboxes. Keep the "What NOT to do" section verbatim; Jules has been observed wandering across packages when it is omitted.
- **Gemma / smaller local models** — Be more literal: list exact file paths, exact shell commands, exact comment markers. Drop the "philosophy" framing and replace it with a numbered procedure.

## Concurrency note

Before dispatching multiple beads in parallel, verify their `scope:` labels are disjoint:

```bash
bd query "label=delegate:any-low status=open" | awk '/scope:/ {print}'
```

Two runners claiming the same `scope:` at once will produce merge conflicts; the orchestrator is responsible for serializing same-scope beads.
