## Context

`packages/store/src/layoutSelectors.ts`'s `resolveSpace` packs a `SpaceInstance`'s *actual* `constraints` (a `Record<BinSpecId, SpaceConstraint>`) against its template — it has no notion of previewing a different system.
`packages/assembly/src/SpaceConstraint.ts`'s `createSpaceConstraint(binId, hardMin, softMin, max?)` already has an unconstrained-fill mode: called with `hardMin === 0 && softMin === 0` it returns `{ mode: "auto", binId, lo: 0, hi: null, hard: false, color }` — "place as many of this bin as fit, no minimum." This is exactly the PRD §8.2 "unconstrained baseline" strategy; it requires no new constraint concept, only a new selector that builds one `auto` constraint per compatible catalog bin.
`packages/catalog/src/lookup.ts`'s `ALL_BINS` plus the established `ALL_BINS.filter((bin) => bin.system === X)` pattern (`apps/web/src/ui/ConstraintEditorPanel.tsx:58`) is how "every SKU for system X" is already computed elsewhere in the app.
`PackingResult.metrics` (`packages/assembly/src/PackingResult.ts`) carries `areaUtilization: number` and `placedCounts: Readonly<Record<string, number>>`, from which bin count (sum of values) and SKU count (number of nonzero keys) are plain arithmetic — no new schema.

**The gap the proposal didn't anticipate:** `SpaceInstanceSchema` (`packages/assembly/src/SpaceInstance.ts`) has `system: StorageSystemSchema.optional()`, but reading `packages/store/src/StoreTypes.ts`, `useStore.ts`, and `StoreHelpers.ts` shows `system` is written exactly once, at creation time, by `apps/web/src/ui/spaceManager/CreateSpaceFormPanel.tsx` (backed by `CreateSpaceForm.ts`, where `system` is a *required* field). No store action changes `system` or wholesale-replaces constraints on an existing space. Every existing constraint mutation (`setConstraintForSpace`, `removeConstraintForSpace`, `setSpaceDrillable`) is **template-scoped**: `StoreHelpers.ts`'s `updateConstraintInState`/`removeConstraintFromState` write `constraintsBySpace[templateId]` and mirror the change onto every `SpaceInstance` sharing that `templateId`. So "Select & Customize" — which the proposal describes as setting the space's system and handing off to Configure Mode — needs a genuinely new store action; this design specifies it.

Also relevant: `SpaceInstanceSchema.activeStrategy?: PackingStrategyId` (`packages/assembly/src/BaseTypes.ts`) exists but has zero consumers anywhere in the codebase today — the same category of dead scaffolding `InstallationRequirement` was before `installation-constraints` wired it up.

## Goals / Non-Goals

**Goals:**

- Add a new pure selector, `selectOptionsModeStrategies`, in `packages/store/src/layoutSelectors.ts` that takes a `SpaceTemplate` and returns one `LayoutResolution` per comparable system (`schaller`, `gridfinity`, `akromils`) — each computed by synthesizing an all-`auto` constraint set from that system's catalog bins (minus any excluded by `isBinInstallationAllowed`) and calling the existing `packSpace`.
- Add a new store action, `applySpaceStrategy(spaceId, system)`, that: (a) sets `system` on the one named `SpaceInstance`, and (b) wholesale-replaces `constraintsBySpace[templateId]` (and every sibling instance's mirrored `constraints`) with the same auto-fill constraint set the preview selector computed for that system — so accepting a card leaves Configure Mode showing exactly what the user just previewed, per PRD §8.5 ("Selecting a strategy in Options Mode loads it into Configure Mode for refinement").
- Add `apps/web/src/ui/options/` UI: a card grid (one card per system) reading the new selector, a metrics block per card (utilization %, bin count, SKU count) with best-value highlighting, and "View Layout" / "Select & Customize" actions.
- Add a third tab to `apps/web/src/ui/App.tsx`'s existing `activeTab` state (`"layout" | "bom"` → `"layout" | "bom" | "options"`) as the Options Mode entry point — no router exists in this app, so this follows the existing tab-switching convention rather than introducing one.

**Non-Goals:**

- No solver, scoring engine, or Layer 2 constraint validation. Strategy generation stays synchronous Layer 1 (three `packSpace` calls, each pure).
- No cost/price metric (Gridfinity SKUs are `price: 0` placeholders in `packages/catalog/src/gridfinity.ts`; Schaller/Akro-Mils have real prices — a cost column today would be accurate for two of three systems).
- No use of `activeStrategy`. One strategy per system fully identifies "which card is active" via the existing `system` field; `activeStrategy` is left as unused scaffolding for a future variant-generation change (PRD §8.2 step 2, "fewer large" variants), where it would distinguish multiple strategies *within* one system. Introducing it now for a 1:1 system-to-strategy mapping would be speculative infrastructure with no current reader.
- No constrained strategy generation (respecting user-set hard minimums before Options Mode is shown) — every strategy card is the unconstrained baseline. A space that already has hard/soft constraints set still gets fresh unconstrained preview cards; existing constraints are only touched if the user commits via "Select & Customize".
- No new Zod schema. Every schema touched (`SpaceInstanceSchema.system`, `SpaceConstraintSchema`, `SpaceTemplateSchema`) already exists; this change is pure composition over them.
- `opengrid` and `custom` `StorageSystem` values get no card — `opengrid` has no catalog entries (tracked separately in sm-qrai) and `custom` is not a fixed, purchasable SKU set.

## Packages touched

| Package | Change | Zod impact |
| --- | --- | --- |
| `packages/store` | New `selectOptionsModeStrategies` selector in `layoutSelectors.ts`; new `applySpaceStrategy` action + `StoreHelpers.ts` helper; `StoreTypes.ts` gains the action signature | None — reuses `SpaceConstraintSchema`, `SpaceInstanceSchema` unchanged; no new schema |
| `apps/web` | New `ui/options/` view (card grid, metrics block, best-value highlight); `App.tsx` gains a third tab | None |
| `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer` | **Untouched** | None |

## Decisions

- **Preview selector lives next to `selectPackedLayout`, not inside `resolveSpace`.** `resolveSpace` is instance-shaped (it reads `space.constraints`); the preview only needs a template and a system, so it is a sibling function, not a variant of `resolveSpace`:

  ```ts
  // packages/store/src/layoutSelectors.ts
  const COMPARABLE_SYSTEMS = ["schaller", "gridfinity", "akromils"] as const;
  export type ComparableStorageSystem = (typeof COMPARABLE_SYSTEMS)[number];

  const buildAutoFillConstraints = (
    template: SpaceTemplate,
    system: ComparableStorageSystem,
    catalog: readonly CatalogBinSpec[],
  ): {
    readonly bins: readonly CatalogBinSpec[];
    readonly constraints: readonly SpaceConstraint[];
  } => {
    const compatible = catalog.filter(
      (bin) =>
        bin.system === system &&
        isBinInstallationAllowed(bin, template.installationConstraints),
    );
    return {
      bins: compatible,
      constraints: compatible.map((bin) => createSpaceConstraint(bin.id, 0, 0)),
    };
  };

  export const selectOptionsModeStrategies = (
    template: SpaceTemplate,
    catalog: readonly CatalogBinSpec[] = ALL_BINS,
  ): Readonly<Record<ComparableStorageSystem, LayoutResolution>> =>
    Object.fromEntries(
      COMPARABLE_SYSTEMS.map((system) => {
        const { bins, constraints } = buildAutoFillConstraints(
          template,
          system,
          catalog,
        );
        const result = packSpace(template, bins.map(toPackInput), constraints);
        return [system, layoutResolutionResolved(result, [])];
      }),
    ) as Readonly<Record<ComparableStorageSystem, LayoutResolution>>;
  ```

  `unresolvedBinIds` is always `[]` here — every bin comes straight from the catalog, so there is no "unknown bin id" case the way user-entered constraints can have one.

- **Metrics are derived, not stored.** A small pure helper in `apps/web/src/ui/options/` (not the store — this is presentation logic, not domain data) turns a `PackingResult` into `{ utilizationPct, binCount, skuCount }`:

  ```ts
  const toCardMetrics = (result: PackingResult) => ({
    utilizationPct: result.metrics.areaUtilization * 100,
    binCount: Object.values(result.metrics.placedCounts).reduce(
      (sum, n) => sum + n,
      0,
    ),
    skuCount: Object.values(result.metrics.placedCounts).filter((n) => n > 0)
      .length,
  });
  ```

  "Best value per metric" highlighting is `Math.max` across the (at most 3) cards' `utilizationPct`/`binCount`/`skuCount` — a pure comparison, not a weighted score, so no card is ever crowned an overall winner (product principle #5).

- **`applySpaceStrategy(spaceId, system)` takes a space id, not a template id, but still mutates template-scoped state — matching every other constraint action's actual behavior.** The action needs the instance id because `system` is instance-scoped (only place it's ever written), but the constraint replacement must go through the same `constraintsBySpace[templateId]` + sibling-mirroring path every other constraint mutation already uses, or an instance's constraints would silently diverge from its template's shared list the next time any other constraint action runs. Implementation:

  ```ts
  // packages/store/src/StoreTypes.ts — AppActions
  readonly applySpaceStrategy: (
    spaceId: SpaceInstanceId,
    system: ComparableStorageSystem,
  ) => void;
  ```

  ```ts
  // packages/store/src/StoreHelpers.ts
  export const applyStrategyInState = (
    state: AppState,
    spaceId: SpaceInstanceId,
    system: ComparableStorageSystem,
    catalog: readonly CatalogBinSpec[],
  ): Pick<AppState, "constraintsBySpace" | "spaces"> => {
    const space = state.spaces.find((s) => s.id === spaceId);
    const template = space && state.templatesById[space.templateId];
    if (space === undefined || template === undefined) {
      return { constraintsBySpace: state.constraintsBySpace, spaces: state.spaces };
    }
    const { constraints } = buildAutoFillConstraints(template, system, catalog);
    const constraintsRecord = Object.fromEntries(
      constraints.map((c) => [c.binId, c]),
    );
    return {
      constraintsBySpace: {
        ...state.constraintsBySpace,
        [space.templateId]: constraints,
      },
      spaces: state.spaces.map((s) => {
        if (s.id === spaceId) return { ...s, system, constraints: constraintsRecord };
        if (s.templateId === space.templateId)
          return { ...s, constraints: constraintsRecord };
        return s;
      }),
    };
  };
  ```

  Only the clicked instance gets `system` updated; every sibling on the same template gets the new constraint set mirrored (consistent with today's behavior for every other constraint edit) but keeps its own prior `system` value.
  **Adversarial review (sm-mol-v9mn) caught a bug in an earlier draft of this snippet:** a ternary keyed off `s.templateId === space.templateId` first, falling through to `s.id === spaceId` only in the `else` branch, meant the clicked space (which always matches its own `templateId`) took the first branch and never reached the `system`-setting branch — `system` was silently never updated on the clicked space, contradicting this document's own "Strategy Selection Commits System" spec scenario. The `if (s.id === spaceId) ... ` ordering above checks identity first specifically to avoid this; a black-box test asserting `space.system === "gridfinity"` after commit is required to pin this (see spec.md's corresponding scenario).
  This is a pre-existing model asymmetry (constraints are template-scoped, `system` is instance-scoped) that this change inherits rather than resolves — called out under Risks below.

- **`activeTab` grows a third literal, no router introduced.** `apps/web/src/ui/App.tsx` already switches between `"layout"` and `"bom"` via local `useState`; Options Mode becomes a third value rendering a new `OptionsPanel` component. No new navigation abstraction for a change this size.

- **`OptionsPanel` MUST wrap `selectOptionsModeStrategies` in `useMemo`, matching the app's existing selector convention — not optional, not a follow-up.** Adversarial review (sm-mol-v9mn) found every existing derived-selector call site already does this: `LayoutCanvas.tsx:246` wraps `selectPackedLayout` in `useMemo([spaces, activeSpaceId, templatesById])`, and `BOMPanel.tsx` does the same for `selectPackingResultsBySpace`. `selectOptionsModeStrategies` runs **three** `packSpace` calls per invocation (one per system) versus one for the existing selectors, so calling it unmemoized in the render body — which nothing in an earlier draft of this document ruled out — would triple the packing cost on every unrelated re-render of a shared ancestor. `OptionsPanel` must call it as:

  ```ts
  const strategies = useMemo(
    () => selectOptionsModeStrategies(activeSpace.template),
    [activeSpace?.template],
  );
  ```

  This costs nothing beyond following the pattern that already exists everywhere else in `apps/web`; it is a hard requirement of this design, not a Risk to revisit later.

- **`OptionsPanel` MUST guard `activeSpaceId === null` the same way `ConstraintEditorPanel` already does.** Adversarial review found the data-flow diagram below implicitly assumes `activeSpace` exists, but `App.tsx` keeps every tab mounted regardless of `activeTab` (confirmed: `LayoutCanvas`/`BOMPanel` are always rendered, hidden via CSS class), so `OptionsPanel` must handle "no active space" from first render — the actual state of a fresh app before any space exists. `ConstraintEditorPanel.tsx:27-36` already has this exact guard (`if (!activeSpace) return <empty-state div>`); `OptionsPanel` reuses that convention rather than inventing a new one. See spec.md's added "No active space" scenario.

### Data flow

```
 App.tsx activeTab === "options"
          |
          v
 OptionsPanel (apps/web/src/ui/options/)
          |
          | selectOptionsModeStrategies(activeSpace.template)
          v
 layoutSelectors.ts (packages/store)
   for each of [schaller, gridfinity, akromils]:
     ALL_BINS.filter(system match)
       .filter(isBinInstallationAllowed)   <-- reused, not reimplemented
       -> createSpaceConstraint(bin.id, 0, 0)  (mode: "auto")
       -> packSpace(template, bins, constraints)   (packages/packer, UNCHANGED)
          |
          v
 { schaller: LayoutResolution, gridfinity: ..., akromils: ... }
          |
          v
 OptionsPanel renders 3 cards: toCardMetrics(result) per card,
 best-value highlight = max across cards (no ranking/score)
          |
          | user clicks "Select & Customize" on the gridfinity card
          v
 applySpaceStrategy(activeSpace.id, "gridfinity")
          |
          v
 StoreHelpers.applyStrategyInState:
   spaces[clicked].system = "gridfinity"
   constraintsBySpace[templateId] = auto-fill constraints (mirrored to
     every space sharing templateId, per existing constraint-edit behavior)
          |
          v
 activeTab -> "layout" (Configure Mode), ConstraintEditorPanel /
 LayoutCanvas now show the same auto-filled Gridfinity layout the
 card previewed, ready for refinement (PRD §8.5)
```

## Risks / Trade-offs

- **Constraint replacement is template-scoped, `system` is instance-scoped — a pre-existing model asymmetry, not introduced here.** If two spaces share a template, applying a strategy to one replaces the constraint set for both, but only the clicked instance's `system` changes. Two siblings can end up with the same bins-with-`auto`-constraints but different `system` labels. This mirrors how every other constraint action already behaves (`setSpaceDrillable`, `setConstraintForSpace`) — not a new risk this change creates, but Options Mode is the first place a user is likely to notice it, since it's the first UI that explicitly frames "pick a system." Fixing the underlying template/instance scoping mismatch is a separate change, not in scope here.
- **Wholesale constraint replacement discards any constraints the user had already set.** "Select & Customize" is a deliberate reset to the previewed auto-fill baseline — same accepted trade-off the proposal names (Options Mode always previews the *unconstrained* baseline, never the user's current constraints). A confirmation step before overwriting non-empty existing constraints is a UX nicety left to implementation, not a spec requirement.
- **Three `packSpace` calls per render of the Options tab.** Each is a pure synchronous MaxRects pack over a bounded catalog (tens of SKUs per system). This is now a hard `useMemo` requirement in Decisions above (adversarial review found this undersold as an optional follow-up in an earlier draft) — with memoization in place, cost is identical to the existing single-pack selectors: one recompute per relevant state change, not per render.
- **`ALL_BINS` grows over time.** `selectOptionsModeStrategies` takes `catalog` as a parameter (default `ALL_BINS`) purely for testability, mirroring `selectPackedLayout`'s existing signature — not a hook for a future "custom catalog" feature.
- **`ComparableStorageSystem` (3 of `StorageSystemSchema`'s 5 values) has no runtime narrowing at any boundary.** Safe today because the only call sites are 3 hardcoded card buttons in `OptionsPanel`, never a value read back from persisted/user-controlled state. If a future change ever re-dispatches `applySpaceStrategy` from a value sourced from `activeSpace.system` (5-value, unvalidated on IndexedDB rehydration) rather than a hardcoded button, that future change must add a type-guard — this design doesn't need one because no such call site exists yet, and adding one speculatively would be validation for a scenario that can't currently happen.

## Adversarial Audit

- **A space's template has `noDrill` set.** Verified: `buildAutoFillConstraints` filters through `isBinInstallationAllowed` before building the `auto` constraint list, so a drill-requiring bin never appears in a card's bins or constraints for that template — consistent with the shipped `installation-constraints` behavior. A unit test must pin this (a `noDrill` template excludes drill bins from every system's preview, not just the space's current system).
- **A system has zero compatible bins for a given template's height** (e.g., all Gridfinity SKUs exceed the drawer's `h`). `packSpace` already filters ineligible-height bins internally (`isHeightEligible`) and returns a `PackingResult` with zero placements rather than throwing — so that card simply renders 0% utilization / 0 bins / 0 SKUs, not an error. No special-case handling needed in the selector.
- **`applySpaceStrategy` called with an unknown `spaceId`.** `applyStrategyInState` looks up `space` and returns the state unchanged (no-op) if not found — mirrors `setTemplateDrillableInState`'s existing "return state unchanged if template missing" guard, so a stale id from a race (e.g. space removed while its Options tab was open) cannot corrupt state.
- **Applying a strategy back-to-back for two different systems on the same space.** Each call replaces the full `constraintsBySpace[templateId]` entry (not a merge), so no constraint from the previously-applied system can leak into the newly-applied one — unlike `updateConstraintInState`'s single-bin merge, this is a full replace, which is required here since switching systems should never mix bins from two systems' constraint sets.
- **Sibling-space mirroring interacting with a mid-air constraint edit.** If a user is mid-edit on constraints for space B (sharing a template with space A) when Options Mode is used on space A, `applyStrategyInState`'s wholesale replace of `constraintsBySpace[templateId]` overwrites B's in-progress edits too — an accepted consequence of the template-scoped model shared with every other constraint mutation today, not a new failure mode.
- **DAG regression.** New imports are `catalog -> store` (already used by `layoutSelectors.ts`) and `assembly -> store` (already used by `StoreTypes.ts`); `apps/web` only gains new files under `ui/options/`, no new edges. `bun run lint`'s topology rule sees nothing new.
