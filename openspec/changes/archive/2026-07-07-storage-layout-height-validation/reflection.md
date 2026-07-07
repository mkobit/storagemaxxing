# Reflection: storage-layout-height-validation

## 🔍 Process Analysis

### 1. Beads Metadata

- **Turnaround Time**: Scoping (Fable, partial) + design completion + implementation all landed in one extended session, spanning a model-tier fallback and a session-limit crash recovery. Once the design was approved and beads unblocked, all 7 implementation beads closed in a single continuous pass with no blockers.
- **Label Consistency**: All 7 child beads carry `meta:openspec:storage-layout-height-validation` plus `scope:assembly`/`scope:packer`. Straightforward to regenerate `tasks.md` from `bd query`.
- **Bottlenecks**: The `bd create --deps blocks:` direction bug (see retrospective §3) was the real bottleneck — it wasn't caught until a deliberate `bd ready` sanity check after unblocking both this change and the sibling `layout-fit-to-viewport` change. Had it shipped uncaught, an agent could have claimed the quality-gate task first and closed it against no actual implementation.

### 2. OpenSpec Workflow

- **Design Clarity**: `design.md`'s D1–D4 decisions were concrete enough to implement almost mechanically, with one real flowback (the `generateAutoFillRects` non-null-assertion bug design.md had assumed away). The flowback was small, documented inline in D1, and didn't require re-opening the human-review checkpoint since it didn't change the design's conclusions, only corrected a factual claim about existing code.
- **Task Granularity**: 7 tasks for a 2-package change was slightly too fine-grained at the 3.1/3.2 boundary specifically — they had to be implemented and committed together. Every other task boundary (1.1, 2.1, 2.2, 4.1, 4.2) held cleanly as an independent, separately-testable, separately-committable unit.
- **Artifact Friction**: `bunx openspec validate --strict` and the D6 package-manifest test both did their job catching drift (a missing data-flow diagram on the first design.md draft; stale AGENTS.md ts-exports after implementation). Both were one-command fixes.

### 3. Multi-Agent Coordination

- **Model Tiering**: The Fable-for-scoping convention partially broke down this session — the first Fable agent (this change) crashed after `proposal.md` only, the second Fable agent (the sibling `layout-fit-to-viewport` change) completed fully. Both crashes traced to a shared subagent quota, not a Fable-specific limitation, per user clarification mid-session. Worth updating the model-tiering guidance to note that a scoping-agent crash should prompt asking the user how to proceed (wait for reset vs. Sonnet fallback) rather than assuming either default.
- **Guidewire Compliance**: Engineering Rails held throughout — no `let`, no mutation, no `any`, strict typing, DAG import direction unchanged (`assembly`/`packer` only, zero `store`/`web` changes as the design predicted).

## 🚀 Follow-up Actions

- **[ ] File and prioritize `sm-tdrm`** (root tsconfig excludes `packages/*/test` from `bun run typecheck`) — a real gap that let a type hazard sit undetected in a merged file for an unknown number of prior changes. Already filed at P2.
- **[ ] File and prioritize `sm-h2kv`** (`bd create --deps blocks:` inverts direction) — already filed at P2, recommend fixing before the next multi-task OpenSpec sync so it doesn't silently recur.
- **[ ] Revisit the model-tiering `bd remember`/memory entry** for Fable scoping-agent crashes: current guidance says "ask the user next time" — this session did ask on the second occurrence and got a clear answer (shared quota, continue as Sonnet). Consider promoting that answer into a firmer default for next time rather than re-asking every session.
