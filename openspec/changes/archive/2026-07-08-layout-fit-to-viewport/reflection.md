# Reflection: layout-fit-to-viewport

## 🔍 Process Analysis

### 1. Beads Metadata

- **Turnaround Time**: Scoping (Fable, full pass this time) plus implementation landed in the same extended session as the sibling `sm-csu4` change. Once unblocked, all 5 implementation beads closed in one continuous pass.
- **Label Consistency**: All 5 child beads carry `meta:openspec:layout-fit-to-viewport` plus `scope:web`. `tasks.md` regenerated cleanly from `bd query`.
- **Bottlenecks**: The `bd create --deps blocks:` inversion bug (tracked in `sm-h2kv`) recurred here identically to `sm-csu4` and again required a manual `bd ready` sanity check to catch before handoff — this is now confirmed as a systemic tooling issue, not a one-off mistake, and should be prioritized accordingly.

### 2. OpenSpec Workflow

- **Design Clarity**: `design.md`'s D1–D7 were concrete enough to implement almost verbatim — the fit formulas transferred directly into code with no ambiguity. One real flowback (the e2e pixel-assertion risk being wrong), documented inline rather than requiring a new review cycle since it didn't change the design's conclusions.
- **Task Granularity**: 5 tasks for an `apps/web`-only change held up well; no task needed merging like `sm-csu4`'s 3.1/3.2, though 2.1 (2D rewire) and 2.2 (wireframe rewire) both independently depended only on 1.1/1.2, allowing them to be done in either order.
- **Artifact Friction**: `bunx openspec validate --strict` caught nothing this round (proposal warnings were non-blocking length nits). The D6 package-manifest test wasn't triggered since no new package-level exports were added to `packages/*` (this change is entirely `apps/web`-scoped, consistent with the design's Impact section).

### 3. Multi-Agent Coordination

- **Model Tiering**: Fable completed this scoping pass fully on a fresh session, in contrast to its crash on the sibling `sm-csu4` change earlier in the same session — supports the earlier finding that the crashes were a shared subagent-quota issue, not a Fable capability limitation, and that retrying with a fresh Agent call is a reasonable next step rather than assuming Fable itself is unreliable for this class of task.
- **Guidewire Compliance**: Engineering Rails held — `viewportFit.ts` has zero canvas/DOM/React imports (verified via `rg`), no `let`, no mutation, and the DAG import direction stayed legal (`apps/web` importing `geometry`/`assembly`/`catalog` types only).

## 🚀 Follow-up Actions

- **[ ] Prioritize `sm-65ad`** (packSpace NaN-origin placements) — found during this change's manual verification, actively breaks both render modes for any pack where a bin cannot fit at all, not merely a design-time risk.
- **[ ] Prioritize `sm-h2kv`** (`bd create --deps blocks:` direction) — now confirmed recurring across two independent OpenSpec syncs in the same session; worth fixing before it causes a real handoff mistake instead of just extra verification overhead.
- **[ ] Extend `apps/web/AGENTS.md`'s canvas/viewport note** (from `sm-8khu`) with the `locator.screenshot()` element-screenshot technique as a third mitigation alongside `fullPage: true` and a taller viewport.
- **[ ] Adopt "verify design.md Risk claims against an actual test run before writing them"** as a standing design-review practice — this is the second change in a row where a Risk section's "no assertions should break" claim was wrong and only caught by actually running the suite.
