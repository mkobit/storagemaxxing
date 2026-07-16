## Context

`packages/catalog/src/installationRequirement.ts` defines `InstallationRequirement` (`drill` / `rail` / `adhesive` / `freestanding` / `stack-only`) as a plain readonly interface with zero consumers.
`packages/assembly/src/BaseTypes.ts` already defines `InstallationConstraintSchema` as a Zod discriminated union whose first member is `{ type: "noDrill", surface?, notes? }`, and `SpaceTemplateSchema` in `SpaceTemplate.ts` already carries `installationConstraints: z.array(InstallationConstraintSchema).readonly()` — but `createSpaceTemplate` always sets it to `[]` and nothing reads it.
`packages/store/src/layoutSelectors.ts` is where constraints meet bins: `resolveSpace` looks up each `SpaceConstraint`'s bin via `findBinById`, maps the found bins through `toPackInput` (which keeps only id, w/l/h, and tolerances), and calls `packSpace(template, bins, fittingConstraints)`.
`packSpace` in `packages/packer` is purely geometric and must stay that way; `PackInput` has no constraint fields.
`apps/web/src/ui/ConstraintEditorPanel.tsx` renders the per-space constraint rows and the "Add Bins" catalog list; it already disables the Add button per-bin via the `isAdded` pattern.
This design wires the two dead ends together per the approved proposal: bins declare how they mount, a space declares `noDrill`, and the store selector filters before packing.

## Goals / Non-Goals

**Goals:**

- Add an optional `installation` field to `BinSpec` in `packages/catalog` so bins can declare a mounting requirement (schema shape only; annotating real catalog entries is only needed where tests require it).
- Add a store action that sets/unsets a `{ type: "noDrill" }` entry on a template's existing `installationConstraints` array — today no action updates a template after `addTemplate`.
- Filter drill-requiring bins inside `layoutSelectors.resolveSpace` before `toPackInput`, so packing and auto-fill never place them when `noDrill` is set.
- Surface one plain-language toggle in `ConstraintEditorPanel` — "Can I drill into this space?" — and grey/disable drill-requiring bins in its Add Bins list while `noDrill` is set.

**Non-Goals:**

- `maxWeightLbs` and `railPresent` are explicitly deferred to a follow-on change, per the proposal: weight budgeting across placed quantities and conditional catalog expansion are solver-adjacent and do not fit Layer 1's synchronous 2D geometric fitting. Only the boolean exclude-by-type path ships here. The other `InstallationConstraintSchema` members (`noAdhesive`, `noWallMount`, `custom`) likewise get no UI or filtering behavior.
- No changes to `packages/geometry`, `packages/assembly` (its schemas are reused byte-for-byte), or `packages/packer` (`PackInput` and `packSpace` stay purely geometric).
- No new persistence format: `installationConstraints` is already part of `SpaceTemplateSchema`, `SketchSchema`, and the zustand `partialize` set, so a non-empty array round-trips today — it just needs test coverage.
- No filtering by `installation` types other than `"drill"`, and no deletion of a user's existing constraint rows when `noDrill` is toggled on.

## Packages touched

| Package | Change | Zod impact |
| --- | --- | --- |
| `packages/catalog` | `BinSpec` gains `readonly installation?: InstallationRequirement` | None — `BinSpec` is a plain TS interface, not a Zod schema; catalog entries are typed literals with no runtime parse |
| `packages/store` | New `setSpaceDrillable` action; installation filter in `resolveSpace`; exported `isBinInstallationAllowed` predicate | None — reuses assembly's existing `InstallationConstraintSchema` unchanged; `SketchSchema` already validates non-empty arrays |
| `apps/web` | Drillable toggle + Add Bins greying in `ConstraintEditorPanel` | None |
| `packages/geometry`, `packages/assembly`, `packages/packer` | **Untouched** | None |

## Decisions

- **Catalog change is an interface field, not a Zod schema.** `BinSpec` has no `BinSpecSchema`; catalog entries are compile-time-checked literals. The bead's acceptance wording says "Zod schema changes" — the concrete answer is that the only Zod schemas in play (`InstallationConstraintSchema`, `SpaceTemplateSchema.installationConstraints`, `SketchSchema`) already exist in `packages/assembly` and `packages/store` and need **zero diffs**. Introducing a speculative `InstallationRequirementSchema` Zod validator with no parse site would violate the minimum-code rail. The catalog diff:

  ```ts
  // packages/catalog/src/bin.ts
  import { InstallationRequirement } from "./installationRequirement";

  export interface BinSpec<T extends number = number> {
    // ...existing fields unchanged...
    readonly installation?: InstallationRequirement;
  }
  ```

  `installationRequirement.ts` is already exported from the catalog index; it gains no changes.

- **Store action: `setSpaceDrillable(templateId, drillable)`.** A boolean-parameterized action matches the single plain-language question and avoids exposing the full `InstallationConstraint` union to the UI before it is needed:

  ```ts
  // packages/store/src/StoreTypes.ts — AppActions
  readonly setSpaceDrillable: (
    templateId: SpaceTemplateId,
    drillable: boolean,
  ) => void;
  ```

  Implementation in `useStore.ts` rebuilds the template immutably: `drillable: false` appends `{ type: "noDrill" }` if no `noDrill` entry exists; `drillable: true` filters all `type === "noDrill"` entries out. Other constraint types in the array are preserved untouched. Idempotent in both directions (toggling twice is a no-op), so no duplicate entries can accumulate.

- **One shared predicate, exported from the store.** Both the selector filter and the UI greying must agree, so a single pure function lives in `layoutSelectors.ts` and is exported for `apps/web` (DAG edge `store → web` already exists):

  ```ts
  // packages/store/src/layoutSelectors.ts
  export const isBinInstallationAllowed = (
    bin: CatalogBinSpec,
    constraints: SpaceTemplate["installationConstraints"],
  ): boolean =>
    !(
      bin.installation?.type === "drill" &&
      constraints.some((c) => c.type === "noDrill")
    );
  ```

  Bins with `installation` undefined (the entire current catalog) always pass, satisfying the never-filtered guarantee for unannotated entries.

- **Filter both the bins list and the constraints list in `resolveSpace`.** This is load-bearing, verified against `packages/packer/src/packerUtils.ts`: `generatePhaseRects` silently skips constraints whose bin is absent from the bin map, but `checkPhaseFailures` iterates **all** constraints and reports `placed < required` failures. Filtering only the `PackInput` list while leaving a hard constraint for a drill bin in `fittingConstraints` would flip the whole layout to `invalid` with a spurious failure. So `resolveSpace` partitions the `resolved` pairs once — entries whose bin is defined but fails `isBinInstallationAllowed(bin, template.installationConstraints)` are dropped from both `fittingConstraints` and the `bins` array before `toPackInput`/`packSpace`. Excluded bins are not added to `unresolvedBinIds` (that list means "unknown bin id", a data problem; exclusion is intentional) and `LayoutResolution` gains no new field — the UI derives greying from template + catalog data directly, not from the packing result.

- **UI keys off the template, not the space instance.** `installationConstraints` lives on `SpaceTemplate`, so the toggle reads `templatesById[activeSpace.templateId]` and calls `setSpaceDrillable(activeSpace.templateId, ...)`. Spaces sharing a template share the answer, consistent with how `constraintsBySpace` is already keyed by `templateId`. The Add Bins rows compute `const allowed = isBinInstallationAllowed(bin, template.installationConstraints)` and reuse the existing `disabled` button pattern (`isAdded`) plus greyed text for the row; the button label stays "+ Add" but disabled, with a `title` hint explaining why.

- **Existing constraint rows for drill bins stay visible when `noDrill` is toggled on.** The user's constraint data is never deleted by the toggle; the rows simply produce zero placements because `resolveSpace` drops them before packing. Toggling `noDrill` back off restores the exact prior behavior, satisfying the spec's "Unsetting noDrill restores default behavior" scenario without any state migration.

### Data flow

```
 ConstraintEditorPanel (apps/web)
   "Can I drill into this space?"  [toggle, default: yes]
          |
          | setSpaceDrillable(activeSpace.templateId, false)
          v
   useStore: templatesById[templateId].installationConstraints
             += { type: "noDrill" }                    (packages/store)
          |
          +--------------------------+-----------------------------------+
          |                          |                                   |
          v                          v                                   v
   layoutSelectors.resolveSpace   ConstraintEditorPanel            SketchSchema /
     isBinInstallationAllowed?      Add Bins list                  zustand persist
     drops drill bins from          isBinInstallationAllowed?      (already handles
     bins[] AND fittingConstr.      greys row + disables           non-empty arrays;
     BEFORE toPackInput             "+ Add" button                 no format change)
          |
          v
   packSpace(template, bins, constraints)   (packages/packer — UNCHANGED,
          |                                  never sees installation data)
          v
   PackingResult -> LayoutCanvas / BOMPanel  (zero drill-bin placements,
                                              BOM excludes them for free)
```

## Risks / Trade-offs

- **Template-level toggle granularity.** Because the constraint lives on `SpaceTemplate`, two spaces created from the same template cannot answer the drill question differently. Today every creation path (`GoldenPathSetup`, `SpaceManager`) mints a fresh template per space, so this is theoretical; if per-instance constraints are ever needed, that is a data-model change for a future proposal, not this one.
- **Predicate lives in `store`, not `assembly` or `catalog`.** The predicate needs both a catalog `BinSpec` and assembly `InstallationConstraint`s, so under the DAG (`catalog → assembly → ... → store`) the store is the lowest package that legally sees both without adding a new edge. The cost is that `apps/web` imports a filtering rule from `store` rather than a domain package — acceptable because the store is already web's single data-access layer.
- **No feedback when a constrained bin is silently excluded.** If a user adds a drill bin and later toggles `noDrill`, the constraint row remains but places nothing, and nothing in `LayoutResolution` names it as excluded. The greyed catalog row is the only signal. Adding an `excludedBinIds` field to the resolved variant was considered and rejected as speculative — no spec scenario requires it, and it can be added compatibly later.
- **Boolean action shape vs. future constraint types.** `setSpaceDrillable` will not generalize to `maxWeightLbs` (needs a value) or `railPresent`. That is deliberate: the deferred follow-on change owns designing a general `setInstallationConstraint` surface if and when those ship, and one boolean action is trivial to migrate.

## Adversarial Audit

- **Hard constraint on a drill bin + `noDrill` set.** Verified failure mode: without constraint filtering, `checkPhaseFailures` would report the drill bin as an unmet hard requirement and mark the layout invalid. The both-lists filter in `resolveSpace` prevents this by construction; a unit test must pin it (hard-mode drill-bin constraint + `noDrill` → `validity` unaffected, zero placements of that bin).
- **Toggle spam.** `setSpaceDrillable` is idempotent per direction (append-if-absent / filter-all), so rapid toggling cannot accumulate duplicate `noDrill` entries or corrupt other constraint types in the array.
- **Persisted sketch from before this change.** Old sketches have `installationConstraints: []`, which parses and filters nothing — byte-for-byte today's behavior. A sketch exported with `noDrill` set round-trips through the existing `SketchSchema` because `InstallationConstraintSchema` already validates the entry; a round-trip test with a non-empty array is required per the proposal's persistence note.
- **Bin id present in constraints but unknown to the catalog.** Unchanged path: `findBinById` misses, the id lands in `unresolvedBinIds` before the installation filter is consulted, so exclusion logic never sees an `undefined` bin.
- **`toPackInput` leaking installation data into the packer.** Impossible by type: `PackInput` has no `installation` field and `toPackInput` copies only id/dimensions/tolerances, so even an unfiltered call cannot make `packSpace` constraint-aware.
- **DAG regression.** New imports are `catalog → store` (already used by `layoutSelectors`), `assembly → store` (already used by `StoreTypes`), and `store → web` (already used by `ConstraintEditorPanel`); `bun run lint`'s topology rules see no new edges.
