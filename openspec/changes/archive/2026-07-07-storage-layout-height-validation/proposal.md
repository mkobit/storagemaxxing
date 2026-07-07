## Why

`packSpace()` never compares any bin's effective height against the space's height.
`getEffectiveSpaceDimensions` (in `packages/packer/src/geometryUtils.ts`) reads `space.h`, but the value only rides along — the `MaxRectsPacker` core reasons purely about 2D (`w` × `l`) footprints, and no phase in `packages/packer/src/packer.ts` ever checks `h`.
A bin with effective height 3 packs into a drawer with `h: 2` and the result comes back `validity: "valid"` with `metrics.failures` empty (bug bead sm-csu4, discovered during the `wireframe-layout-preview` scoping pass, sm-9bdk).

The wireframe preview shipped in change `2026-07-05-wireframe-layout-preview` made this visible: a too-tall bin literally pokes above the space's top edge in the oblique view.
That change deliberately deferred the fix — drawing heights honestly is a rendering concern; deciding what a height violation *means* for `PackingResult.validity` and `metrics.failures` is a packer-contract question that belongs in the `storage-layout` spec.
This proposal answers that question.

The existing Golden-Path Packing requirement already promises "no placement outside the space bounds", and a placement whose height exceeds `space.h` is outside the bounds — the spec's intent is already violated, it just lacks a scenario and a test that would catch it.
The product promise ("the layout you see will physically work in your drawer") is not enforceable until the packer models height overflow as an observable failure, the same way `2026-06-28-storage-layout-observable-failures` made unresolved bins and non-valid packs observable.

## What Changes

- `packSpace()` gains a height gate: a bin whose effective height (`h` + `toleranceH`) exceeds the space's height is physically unplaceable in that space, is excluded from every packing phase, and never appears in `placedBins`.
- Each constraint with a positive demand (`hardMin > 0` or `softMin > 0`) on an excluded bin produces a new `metrics.failures` entry with reason `"heightOverflow"`, carrying the bin's effective height and the space height so the UI can say "bin is 3 in, drawer is 2 in".
- Height overflow downgrades `validity` through the same lattice the phase checks already use: an unmeetable hard minimum forces `invalid`; an unmeetable soft minimum (with hard minimums intact) forces `partial`; auto/off/max-only constraints do not move validity, mirroring how footprint overflow behaves for those modes today.
- `ConstraintFailure` in `packages/assembly/src/PackingResult.ts` becomes a discriminated union on `reason`: the existing `"hardMin" | "softMin"` variant keeps its `required`/`placed` counts unchanged; the new `"heightOverflow"` variant carries `binHeight`/`spaceHeight` instead of pretending heights are counts.
- Spaces without a defined `h` (footprint-only templates) are height-unconstrained: the gate is skipped entirely, not applied against a defaulted `0`.
- The `accessFace: "front"` depth cap (`getMaxBinDepth`) is computed from height-eligible bins only, so a bin that can never be placed cannot widen or narrow the effective packing area.

## Capabilities

### New Capabilities

(None — this change extends the existing `storage-layout` capability's packing contract.)

### Modified Capabilities

- `storage-layout`: the Golden-Path Packing requirement gains a height-validation clause and three scenarios (too-tall demanded bin is reported and not placed; too-tall soft-demand yields `partial`; undefined space height means unconstrained). Behavior for bins that fit vertically is unchanged.

## Impact

- Affected packages in the DAG: `assembly` (`ConstraintFailure` becomes a discriminated union with a new factory; existing count-based variant unchanged) and `packer` (height gate in `packSpace`, eligibility partition feeding `getMaxBinDepth` and all phases).
- Explicitly unaffected: `geometry`, `catalog`, `store` (passes `PackingResult` through opaquely), and `apps/web` — `rg` confirms nothing outside `packages/assembly` and `packages/packer` reads `metrics.failures` or `ConstraintFailure` today, and the existing validity badge already renders `invalid`/`partial` (shipped in `storage-layout-observable-failures`), so the new downgrade surfaces in the UI with zero web changes.
- The wireframe preview is untouched: exclusion means a too-tall bin no longer appears in `placedBins`, so it stops poking out of the wireframe for free; the renderer itself is not modified.
- Affected tests: `packages/packer/test/golden-path.test.ts` gains the sm-csu4 repro (space `h: 2`, bin effective `h: 3`), plus unit tests for the eligibility partition, the validity lattice, and the depth-cap interaction; `packages/assembly` tests cover the new failure variant's factory.
- No new dependencies, no serialization changes, no Layer 2 work.

## Success Criteria

- The sm-csu4 acceptance criterion passes as a `bun test packages/packer` case: given a space with `h: 2` and a hard-constrained bin with effective height 3, `packSpace` returns `validity !== "valid"` and a `metrics.failures` entry with `reason: "heightOverflow"` identifying that `binId`.
- A too-tall bin never appears in `placedBins`, regardless of constraint mode.
- A space template without `h` packs exactly as today (no height gate applied), verified by a regression test.
- The golden-path happy case is byte-identical: all bins fitting vertically produce the same `PackingResult` as before this change.
- `bunx openspec validate` passes for the delta; `bun run lint`, `bun run typecheck`, and `bun test` pass.
