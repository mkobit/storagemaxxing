# Delegation Contract for Low-Capability Runners

## Purpose

This contract defines when and how a bead is safe to hand to a low-capability runner (Jules, Gemma-class, or any agent without the reasoning budget for design judgement).
It extends the base Bead task contract in [`AGENTS.md`](../../AGENTS.md); it does not replace it.

A bead is _delegate-ready_ only if it satisfies every rule below.
Beads that fail any rule must be re-shaped, split, or kept for an Opus-class agent.

## Label taxonomy

Apply these labels to every delegate-ready bead.
They are additive — keep existing `scope:`, `meta:openspec:*`, and `slice:*` labels.

| Label family | Values                                                | Meaning                                                                                                                                     |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `delegate:`  | `jules`, `gemma`, `any-low`                           | Known-good recipient(s). `any-low` means either.                                                                                            |
| `effort:`    | `trivial` (<15 min), `small` (<2 h)                   | Wall-clock estimate for the runner.                                                                                                         |
| `mode:`      | `hotl`, `auto-ok`                                     | `hotl` requires human PR review before merge; `auto-ok` is mergeable on CI-green.                                                           |
| `kind:`      | `impl-mechanical`, `impl-narrow`, `research-readonly` | Mechanical = deterministic transform. Narrow = one file with a single judgement call. Research = no file changes; output is a bead comment. |

## Hard rules

1. **Single scope.** The bead carries exactly one `scope:` label. Files touched are inside that package only.
2. **Runnable acceptance.** The acceptance criterion is a single command the runner can execute and observe pass/fail. For `kind:research-readonly`, the command is `bd show <id>` and the assertion is "a comment exists matching pattern X".
3. **No design ambiguity.** If the OpenSpec design leaves a choice (naming, location, signature), the bead description pre-commits to one option. The runner does not negotiate.
4. **Declared output channel.** Description states either (a) the PR branch name pattern (e.g. `delegate/sm-xxxx-short-slug`) or (b) "post findings as bead comment with marker `<!-- delegate-output -->`".
5. **No cross-package import changes.** Delegate-ready beads cannot edit `package.json`, workspace topology, lint configs, or tsconfig project references.
6. **No new tests, no new specs.** If new test infrastructure or a spec change is needed, the bead is not delegate-ready.

## Scope discipline (mandatory for every dispatch)

The dispatched sandbox is expected to enter with a clean working tree (`.jules/env_setup.sh` plus the committed `sync.remote` in `.beads/config.yaml` make this so). Even with a clean baseline, the runner can introduce spurious changes during work — running formatters, regenerating fixtures, or mis-interpreting the prompt.

Every delegated prompt MUST enforce:

1. **Path allowlist for staging.** The runner is only permitted to `git add` paths matching `packages/<scope>/**` (for package-scoped beads) or an explicit allowlist named in the bead description. For `kind:research-readonly` beads the allowlist is empty — no staging permitted.
2. **Pre-commit / pre-comment diff check.** Before commit (impl beads) or before posting the output comment (research beads), the runner MUST run `git status --porcelain`. Any path outside the allowlist is grounds for abort: the runner posts a `<!-- delegate-blocked -->` comment naming the offending paths and stops, instead of guessing.

## Default dispatch mode

The standard dispatch is **autonomous**.
Operators do not approve plans by default; the scope-allowlist + pre-commit diff check are the safety net.

Standard `jules` invocations:

```bash
# impl beads (kind:impl-mechanical, kind:impl-narrow)
jules session create --prompt "$PROMPT" --source mkobit/storagemaxxing \
  --branch main --auto-approve --auto-pr

# research beads (kind:research-readonly) — output is a bead comment, no PR
jules session create --prompt "$PROMPT" --source mkobit/storagemaxxing \
  --branch main --auto-approve --no-auto-pr
```

`--no-auto-approve` is reserved for one-off cases: a brand-new prompt template being validated, or a `mode:hotl` bead that the operator explicitly wants to checkpoint at plan time.

## Concurrency rule

Two `delegate:*` beads MAY be claimed and executed in parallel iff their `scope:` labels differ.
The orchestrator (or a human dispatcher) is responsible for not handing two same-scope beads to different runners simultaneously.

## Queryable measure: concurrency width

The canonical measure for "how many runners can dispatch right now" is the _concurrency width_: the count of distinct `scope:` labels among delegate-ready beads where no bead in that scope is already `in_progress`.

Run [`./.jules/delegate-slate.sh`](../delegate-slate.sh) for a human-readable view or `./.jules/delegate-slate.sh --json` for orchestrator-friendly JSON.
The script emits the concurrency width, the dispatch slate (one bead per dispatchable scope, highest priority first), and any blocked scopes.

```bash
./.jules/delegate-slate.sh                 # default label=delegate:any-low
DELEGATE_LABEL=delegate:jules ./.jules/delegate-slate.sh --json
```

A dispatcher should:

1. **Run `bd dolt push` first.** Jules's `env_setup.sh` runs `bd dolt pull` once at sandbox bring-up. If the bead exists only in your local Dolt DB at dispatch time, Jules will see stale state and refuse to find it. Always push _before_ `jules session create`.
2. Run the slate script to obtain the dispatch slate.
3. Hand each bead in the slate to a distinct runner.
4. Re-run after any claim/close to recompute width before the next dispatch wave.

## Runner workflow

The runner is expected to:

1. `bd update <id> --claim` before touching anything.
2. Read the bead description as the _full_ specification. Do not infer requirements from related beads.
3. Execute the acceptance command locally and observe it passing.
4. For `kind:research-readonly`: post the output as a bead comment with marker `<!-- delegate-output -->` and close the bead.
   For implementation kinds: push a branch matching the declared pattern, open a PR, and leave the bead open with a comment linking the PR. A human (or the orchestrator) closes the bead after merge.
5. **`bd dolt push` MUST be the runner's last command before reporting done.** Every bd write (claim, comment, close) only updates the sandbox-local Dolt DB. Without an explicit push, the deliverable dies with the session — invisible to impl beads (the PR carries them) but fatal for research-readonly. No exceptions.

## Anti-patterns

Do NOT delegate a bead if any of these apply:

- The description says "audit", "evaluate", "decide", or "propose" without a fixed deliverable shape.
- The acceptance command does not exist yet (e.g. blocked on test infra that another bead introduces).
- Two or more reasonable implementations exist and the spec does not pin one.
- Required reading spans more than ~3 files outside the target scope.

## Promotion path

A bead that is _not_ delegate-ready today can become so:

- Add the missing acceptance command (often a new test).
- Split it into a research half (delegate-ready) and an implementation half (still Opus-class) where the research output deterministically constrains the implementation.
- Pin the ambiguous choice in the description.

The first delegate-ready cohort (post `meta:beads-flow` parent `sm-xrm5`) is the per-package "enumerate exported types" research probes.
They produce the input data that the blocked AGENTS.md refresh beads (`sm-b56w`, `sm-3wvg`, `sm-x9fy`, `sm-btx2`, `sm-j84h`) will consume once the manifest test infra (`sm-x84p`) lands.
