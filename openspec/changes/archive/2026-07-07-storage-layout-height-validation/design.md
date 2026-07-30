## Context

`packSpace()` (`packages/packer/src/packer.ts`) reasons about placement in three phases — hard-min, soft-min, capped/auto-fill — all driven by `MaxRectsPacker`, which packs 2D rectangles (`w` × `l` footprints) with no notion of the third axis.
`getEffectiveSpaceDimensions` (`packages/packer/src/geometryUtils.ts`) already reads `space.h` and returns it as part of `Dimensions3D`, but the only consumer of that `h` value today is nothing — it round-trips into the return value and is discarded by every caller.
`packerUtils.ts`'s `checkHardMinPhase`/`checkSoftMinPhase` derive `ConstraintFailure`s purely by comparing `placedCounts` (how many of a bin the 2D packer fit) against `getHardMin`/`getSoftMin` (how many the constraint demands). A bin that is 3 inches tall in a 2-inch-tall drawer packs its footprint just fine — `MaxRectsPacker` has no way to know it doesn't fit — so it is counted as placed, no failure is recorded, and `validity` stays `"valid"`.

This is bead sm-csu4, discovered during the `wireframe-layout-preview` change (sm-9bdk): the oblique wireframe view draws bin height honestly, so a too-tall bin visibly pokes through the top of the space, but the underlying `PackingResult` insists everything is fine.

## Goals / Non-Goals

**Goals:**

- A bin whose effective height exceeds the space's height is never reported as placed, and the resulting `PackingResult` reflects that in both `validity` and `metrics.failures`, per the existing validity lattice (hard-min shortfall → `invalid`, soft-min shortfall with hard minimums met → `partial`).
- Preserve the golden path exactly: every bin that fits in all three dimensions packs and validates identically to today.
- Keep `packages/packer` and `packages/assembly` pure functional and strictly typed — no `any`, no mutation.

**Non-Goals:**

- No 3D bin-packing (no z-axis placement, no stacking, no shelf inference). `packingModel` stays `"2d"`; this change only gates _eligibility_, it does not add a dimension to the packer's placement math.
- No change to the wireframe renderer (`apps/web`) — excluding a too-tall bin from `placedBins` means it stops rendering there for free, with zero renderer changes.
- No change to `w`/`l` overflow handling (`Overflow is reported, not silently dropped`, already covered) — this change only adds the height axis to the existing failure model.

## Data Flow

```
packages/assembly                    packages/packer
------------------                   ----------------
SpaceTemplate.h (optional)  ──┐
                               │      packSpace(space, availableBins, constraints)
PackInput.h + toleranceH  ────┼───►     │
  (per bin, via                │        ├─ partition availableBins by isHeightEligible(bin, space.h)
   getEffectiveFootprint)      │        │     ├─► eligibleBins   ──► binMap ──► executePhases (unchanged)
                               │        │     └─► ineligibleBins ──► one ConstraintFailure{reason:"heightOverflow"}
                               │        │              per positively-constrained ineligible bin
                               │        ├─ getMaxBinDepth(eligibleBins) ──► getEffectiveSpaceDimensions (D4)
                               │        └─ validity = existing hard/soft lattice, now fed by
                               │                       count-based failures ∪ heightOverflow failures
                               ▼
                     PackingResult { placedBins (eligible only), metrics.failures, validity }
                               │
                               ▼
                   packages/store (passes PackingResult through opaquely — no change)
                               │
                               ▼
                   apps/web validity badge (renders validity; already handles invalid/partial)
```

Nothing new crosses the `packer → store → web` boundary — `PackingResult`'s shape gains a union member, not a new field, so existing pass-through code compiles and behaves unchanged.

## Decisions

### D1 — Height-ineligible bins are excluded from every packing phase, not merely flagged after the fact

`getEffectiveFootprint` already computes `{ w, l, h }` including tolerance (`packages/packer/src/geometryUtils.ts:5`); `h` is simply unused downstream. Add a predicate:

```ts
export const isHeightEligible = (
  bin: PackInput,
  spaceHeight: number | undefined,
): boolean =>
  spaceHeight === undefined || getEffectiveFootprint(bin).h <= spaceHeight;
```

`packSpace` partitions `availableBins` into eligible/ineligible using `space.h` (not the depth-capped `dims.h`, which is identical to `space.h` today since `getEffectiveSpaceDimensions` never modifies `h` — only `l` is capped for `accessFace: "front"`). Only eligible bins are added to `binMap` and thus can ever appear in `generatePhaseRects` output; ineligible bins can never enter the `MaxRectsPacker` and therefore can never appear in `placedBins`.

This is simpler than the alternative (let the 2D packer place them, then filter `placedBins` post hoc): filtering after packing would require re-deriving `placedCounts` and would leave a window where an ineligible bin occupies 2D packer state that an eligible bin could have used. Exclusion up front means most of the packer's existing phase logic (`generatePhaseRects`, `sortRects`, `checkHardMinPhase`, `checkSoftMinPhase`) needs no change — it already treats "not in `binMap`" as "contributes zero rects" (`generatePhaseRects`'s `bin ? [...] : acc`), which is exactly the height-exclusion behavior we want, reused rather than reimplemented.

**Correction found during implementation (sm-csu4.4):** `generateAutoFillRects` did _not_ already have this safety property — it resolved `binMap.get(c.binId)!` with a non-null assertion, which was sound only because every prior caller guaranteed every constraint's `binId` was present in `binMap` (binMap was built from the full `availableBins`, unfiltered). Once `binMap` excludes height-ineligible bins, an `auto`-mode constraint on an excluded bin hits that assertion with `undefined` and throws inside `getEffectiveFootprint`. Fixed by changing the map-then-assert to a map-then-filter-`undefined`, matching `generatePhaseRects`'s existing defensive pattern. This does not change D1's conclusion (no change needed to the hard/soft-min phases or `checkHardMinPhase`/`checkSoftMinPhase`'s own rect-generation calls) — it only means `generateAutoFillRects` needed the same treatment those functions already had.

### D2 — Height overflow is reported as a `ConstraintFailure`, and folds into the existing validity lattice by constraint mode — it does not introduce a fourth validity state

`ConstraintFailure.reason` (`packages/assembly/src/PackingResult.ts:7-12`) is today a flat `{ binId, reason: "hardMin" | "softMin", required, placed }` — count-based, because hard/soft-min failures are about _how many_ of a bin got placed. A height failure isn't a count; forcing it through `required`/`placed` (e.g. `required: 1, placed: 0`) would tell the caller a height-ineligible bin was "0% placed due to a minimum" — true but useless for a UI that wants to say "this bin is too tall for this drawer." So `ConstraintFailure` becomes a discriminated union:

```ts
export type ConstraintFailure =
  | {
      readonly binId: string;
      readonly reason: "hardMin" | "softMin";
      readonly required: number;
      readonly placed: number;
    }
  | {
      readonly binId: string;
      readonly reason: "heightOverflow";
      readonly binHeight: number;
      readonly spaceHeight: number;
    };
```

Two factories replace the single `createConstraintFailure`: the existing one keeps its signature (`createConstraintFailure(binId, reason: "hardMin" | "softMin", required, placed)`), and a new `createHeightOverflowFailure(binId, binHeight, spaceHeight)` is added. This is the same pattern `storage-layout-observable-failures` used for `LayoutResolution` (tagged union with per-variant factories) rather than one factory with optional fields.

Height-ineligible bins fold into the validity lattice **by constraint mode**, reusing the phase check order already in `executePhases` (`packages/packer/src/packer.ts:29-74`):

- A bin under a `hard` constraint (or a `soft` constraint's `hardLo`) that is height-ineligible produces a `heightOverflow` failure evaluated in the hard-min phase and forces `validity: "invalid"`, exactly as an unmet hard-min count does today.
- A bin under a `soft` constraint (no unmet hard floor) that is height-ineligible produces a `heightOverflow` failure evaluated in the soft-min phase and forces `validity: "partial"` (if hard-min validity was otherwise `"valid"`), exactly as an unmet soft-min count does today.
- A bin under `auto`/`off` mode, or a bin whose only demand is a `hi` cap with `lo: 0`, that is height-ineligible produces **no failure and no validity change** — mirroring how those modes already tolerate footprint overflow (they simply pack fewer than a hypothetical maximum, which is not a failure).

Concretely: `checkHardMinPhase`/`checkSoftMinPhase` in `packerUtils.ts` gain a `heightIneligibleIds: ReadonlySet<string>` parameter. For each constraint whose `getHardMin`/`getSoftMin` is positive AND whose `binId` is height-ineligible, emit a `heightOverflow` failure (via the new factory) _instead of_ the count-based check for that constraint (a height-ineligible bin's placed count is always 0, so the count-based failure would be redundant and less informative — the height failure replaces it, not adds to it). This is checked before the existing `placed < req` comparison so the more specific failure wins.

`ConstraintFailure` stays a plain TypeScript discriminated union with factory functions, not a Zod schema — consistent with `PackingResult.ts`'s existing types, none of which are Zod-validated today. This is a derived, in-process computation result (no I/O, no persistence, no user input crossing a trust boundary), so it does not need runtime validation; `PackInput` and `SpaceTemplate`, which _do_ cross a trust boundary (catalog data, user-authored templates), already carry the Zod schemas that constrain the `binHeight`/`spaceHeight` numbers this failure variant reports.

Rejected alternative: leave `validity` as `"valid"` and rely solely on `metrics.failures` to signal the problem. Rejected because the Golden-Path Packing requirement already promises "no placement outside the space bounds" as part of what makes a result `valid` — a height-ineligible bin that still reads `valid` would contradict that promise and would let a UI that only checks `validity` (as `apps/web`'s validity badge does today, per `storage-layout-observable-failures`) miss the problem entirely with zero code changes needed on the web side to surface it correctly.

### D3 — `space.h === undefined` means height-unconstrained, not height-zero

`SpaceTemplate.h` is `z.number().optional()` (footprint-only templates may omit `w`/`l`/`h` entirely in favor of `footprint`). `isHeightEligible` treats `undefined` as "no ceiling" (returns `true` unconditionally), never defaulting to `0` — defaulting to `0` would make every bin with positive height fail on every footprint-only template, which is not this change's problem to introduce. This mirrors `getEffectiveSpaceDimensions`'s existing `space.h ?? 0` only being used for the _returned_ `Dimensions3D.h` (a display/consumption value), never for a comparison; the height-eligibility gate reads `space.h` directly, pre-`??`.

### D4 — `getMaxBinDepth` (and the `accessFace: "front"` depth cap) is computed from height-eligible bins only

`getMaxBinDepth` feeds `getEffectiveSpaceDimensions`'s `l: Math.min(l, defaultBinDepth)` for front-accessed spaces — the deepest bin sets how far into the space the packable area extends. If a height-ineligible bin were still counted, a bin that can never be placed could still shrink (or, if it were the only bin, leave unconstrained) the packable depth for bins that _can_ be placed. `packSpace` computes the eligible/ineligible partition **before** calling `getEffectiveSpaceDimensions`, and passes `getMaxBinDepth(eligibleBins)` instead of `getMaxBinDepth(availableBins)`.

## Risks / Trade-offs

- **`ConstraintFailure` becomes a discriminated union**: the two current consumers (`packerUtils.ts`, `packer.test.ts`, `golden-path.test.ts`) already switch on `reason` implicitly via the factory call site, not via field access on a wider shape, so the typechecker — not a runtime search-replace — surfaces every site that needs the new branch. Confirmed via `rg "ConstraintFailure|metrics\.failures"`: only `packages/packer/{packerUtils.ts,packer.test.ts}`, `packages/packer/test/golden-path.test.ts`, and `packages/assembly/src/PackingResult.ts` reference it — no `apps/web` or `packages/store` code reads `metrics.failures` today, so this change is invisible to the web layer except through the `validity` field it already renders.
- **A bin that is both under-count _and_ height-ineligible reports only one failure, not two**: chosen deliberately (D2) so a UI rendering `metrics.failures` doesn't show "need 1 more, have 0" and "3in bin in a 2in drawer" as two unrelated-looking problems for the same root cause. Trade-off: a caller that specifically wants to know "how many were placed" for a height-ineligible bin must infer it's zero from the failure's presence rather than reading a `placed` field. Accepted because no current caller does this.
- **Eligibility is computed once from `space.h`, not re-evaluated per phase**: a bin's height never changes mid-`packSpace` call (no phase mutates `PackInput`), so a single partition up front is equivalent to and cheaper than a per-phase check.
- **This does not fix "front"-access spaces where a bin fits when standing but not when the drawer's _depth_ is treated as the packing axis**: out of scope — `packingModel` stays `"2d"`, and `accessFace` semantics beyond the existing depth cap are unchanged.

## Adversarial Audit

- **What if every bin in `availableBins` is height-ineligible?** `binMap` becomes empty, every phase's `generatePhaseRects` returns `[]`, `packer.bins[0]?.rects` is empty, and `placedBins` is `[]` — identical in shape to the existing empty-constraints contract, except `metrics.failures` is non-empty (one `heightOverflow` per positively-constrained bin) and `validity` reflects that, unlike the true empty-constraints case which reports `valid`. No collision with the `Empty constraints returns valid empty result` scenario, since that scenario is specifically about an empty **constraints array**, not an empty **eligible-bins** set.
- **What if a constraint's `binId` isn't in `availableBins` at all (already-unresolved, per `storage-layout-observable-failures`)?** Unaffected — `generatePhaseRects`'s `binMap.get(c.binId)` lookup already returns `undefined` for that case and contributes no rects; `isHeightEligible` is only evaluated for constraints whose bin resolved in `binMap`, i.e., existing unresolved-bin handling in `packages/store` is untouched and orthogonal to this change.
- **Could a bin be exactly `spaceHeight`?** `isHeightEligible` uses `<=`, so an exact fit is eligible — consistent with the `w`/`l` packer's own "fits with zero clearance" behavior for footprint dimensions, and with `Point2DSchema`/`Dimensions3D` treating dimensions as inclusive bounds elsewhere in the codebase.
- **Floating-point equality at the boundary (`spaceHeight - binHeight` within epsilon)?** Out of scope for this change — the existing packer has no epsilon handling for `w`/`l` boundary fits either (`MaxRectsPacker` is trusted for that), so height gets the same trust, not a new epsilon policy invented just for this axis.
- **Does excluding a bin from `binMap` before `executePhases` change the _order_ in which other bins are considered (`sortRects` sorts by area within a phase)?** No — `sortRects` only sorts the rects actually generated; removing a bin's rects entirely doesn't reorder the remaining ones relative to each other.
