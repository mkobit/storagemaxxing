## Context

Space creation today lives entirely in `apps/web/src/ui/GoldenPathSetup.tsx`: each preset button calls `createSpaceTemplate(id, dimensions, accessFace)` from `packages/assembly/src/SpaceTemplate.ts`, wraps the result plus hardcoded starter constraints in `SpaceInstanceSchema.parse(...)`, then calls the store's `addTemplate`, `addSpace`, and `setActiveSpace` in sequence.
The store (`packages/store/src/useStore.ts`, `StoreTypes.ts`) already holds `spaces: readonly SpaceInstance[]`, `activeSpaceId`, and `templatesById`, and `LayoutCanvas`/`BOMPanel` already derive everything they render from `activeSpaceId` via `selectPackedLayout`/`selectPackingResultsBySpace`. Multi-space is already a first-class concept in the store and selectors — it's just never been reachable from the UI with anything but fixed presets, and there's no affordance to switch `activeSpaceId` after the first space is created.

## Goals / Non-Goals

**Goals:**

- Let a user type columns, rows, and depth/height, pick a `StorageSystem`, and create a new space with those exact dimensions (satisfies sm-5po5's acceptance criterion: 5 columns × 4 rows → active canvas shows a 5×4 grid).
- Let a user switch `activeSpaceId` among all spaces currently in `state.spaces`.
- Reuse `createSpaceTemplate`, `SpaceInstanceSchema`, and the existing store actions unchanged — no new assembly/store/catalog/packer code.

**Non-Goals:**

- Editing or deleting an existing space (create + switch only; matches the bead's acceptance criterion).
- Per-space starter constraints/bins — a newly created custom space starts empty, same as clicking "Create space" with no bins; populating it is the existing `ConstraintEditorPanel`'s job.
- Any change to how `GoldenPathSetup`'s presets work — they remain as-is for demo/golden-path use.
- Non-rectangular footprints — custom spaces use the `w`/`l`/`h` branch of `SpaceTemplateSchema`, same as `createSpaceTemplate` already does.

## Decisions

- **New component, not an extension of `GoldenPathSetup`.** `GoldenPathSetup` is a fixed set of demo buttons; the form-based flow is different enough interaction (text inputs + a list) that a separate `SpaceManager.tsx` component is clearer than overloading `GoldenPathSetup`'s props. It's added to `Toolbar.tsx` alongside `GoldenPathSetup`, not replacing it.
- **Form validation lives in `apps/web`, not `packages/assembly`.** The only genuinely new schema is validating raw form input (strings from `<input>` elements) before it becomes a `Dimensions3D`. This is a UI-input concern, not a domain type, so it's a small Zod schema local to the new component's module — it does not change the package DAG.
  ```ts
  // apps/web/src/ui/spaceManager/CreateSpaceForm.ts
  export const CreateSpaceInputSchema = z.object({
    name: z.string().min(1),
    system: StorageSystemSchema,
    columns: z.coerce.number().int().positive(),
    rows: z.coerce.number().int().positive(),
    depth: z.coerce.number().positive(),
  });
  export type CreateSpaceInput = z.infer<typeof CreateSpaceInputSchema>;
  ```
- **ID generation.** `SpaceTemplateId`/`SpaceInstanceId` are branded strings with no uniqueness enforcement in the schema itself. New spaces get an id via `crypto.randomUUID()` (available in the browser, no new dependency), mirroring how `GoldenPathSetup` uses static string literals for its fixed demo ids.
- **Switching spaces is a plain list + button, not a dropdown.** `activeSpaceId` selection reuses the existing `setActiveSpace` action directly; the list renders `state.spaces` and highlights whichever matches `activeSpaceId`, same pattern `Toolbar.tsx` already uses for `mode` (`select`/`pan`) highlighting.
- **Depth/height maps to `Dimensions3D.h`.** `createSpaceTemplate(id, dimensions, accessFace)` takes `Dimensions3D<w, l, h>`; the form's "columns" → `w`, "rows" → `l`, "depth/height" → `h`, matching the bead description's own ordering and `GoldenPathSetup`'s existing `createDimensions3D(spaceSize, spaceSize, 2)` calls.

### Data flow

Template id and space instance id are two independent `crypto.randomUUID()`
calls, not the same value threaded through — `SpaceInstanceSchema`'s `id` is
the space instance's own id; `templateId` is the separately-generated
template id, read back off `template.id` after `createSpaceTemplate` returns.
This matches `GoldenPathSetup`'s existing pattern of distinct ids.

```
 CreateSpaceForm (apps/web)
   [columns, rows, depth, system, name]
          |
          | CreateSpaceInputSchema.parse(...)
          v
   createSpaceTemplate(crypto.randomUUID(), Dimensions3D, accessFace)  -- packages/assembly (unchanged)
          |
          | template.id
          v
   SpaceInstanceSchema.parse({ id: crypto.randomUUID(), templateId: template.id, name, count: 1, constraints: {} })
          |
          v
   useStore: addTemplate(template) -> addSpace(space) -> setActiveSpace(space.id)
          |
          v
   state.spaces / state.activeSpaceId / state.templatesById  (packages/store, unchanged)
          |
          +--> selectPackedLayout ------> LayoutCanvas   (renders 5x4 grid, empty)
          +--> selectPackingResultsBySpace -> BOMPanel    (empty BOM, correct — no bins yet)

 SpaceSwitcher (apps/web, same panel)
   state.spaces.map(space) -> button onClick=setActiveSpace(space.id)
```

## Risks / Trade-offs

- **`crypto.randomUUID()` browser support.** Available in all evergreen browsers over HTTPS/localhost; no polyfill needed given the project's existing browser support baseline (Vite dev + modern Chromium in Playwright/CI).
- **Unbounded dimensions.** A user could type an absurdly large column/row count; `packSpace()` and `LayoutCanvas` already have to tolerate arbitrary `SpaceTemplate` sizes (nothing today caps `w`/`l`/`h`), so this is consistent with existing behavior, not a new risk class. No new clamping is introduced.
- **Name collisions.** Two spaces can share a `name` (only `id` is unique). The switcher list renders by name, so duplicate names are visually ambiguous but not functionally broken (switching still targets the correct `id`). Acceptable for this change; not a blocker for the acceptance criterion.
- **Empty constraints on creation.** A freshly created custom space has no constraints, so its `PackingResult` will be `valid` with zero placed bins — same empty-result contract path already covered by `storage-layout`'s "Empty constraints returns valid empty result" requirement, so no new packer/store edge case is introduced.

## Adversarial Audit

- **Sync conflict — two rapid "Create space" clicks.** Each click reads `useStore.getState()` fresh at click time (`GoldenPathSetup` already does this pattern), and `crypto.randomUUID()` per click guarantees distinct ids even under rapid double-clicks; no shared mutable counter to race on.
- **Failure mode — invalid form input (e.g. "rows" left blank or non-numeric).** `CreateSpaceInputSchema.parse` throws a `ZodError` before any store action runs, so a bad submission cannot partially add a template without a matching space (mirrors the existing `Toolbar.tsx` `handleImportFile` try/catch-and-surface-error pattern for the sketch-import flow). The "Create space" handler must catch this and render an inline error, not call `addTemplate`/`addSpace` with unvalidated data.
- **Failure mode — switching to a space whose template was somehow removed.** `removeSpace` exists in the store but nothing removes `templatesById` entries; `setActiveSpace` only ever receives ids currently present in `state.spaces` from the switcher's own render, so a stale/missing template is out of scope for this change (already a pre-existing edge case the `LayoutResolution.kind === "missing-template"` path in `storage-layout` handles, unrelated to this UI).
- **Regression risk — `GoldenPathSetup` and the new switcher both call `setActiveSpace`.** No interaction: `setActiveSpace` is a plain setter, last call wins, and the new panel only ever targets ids the user explicitly selects, so a demo preset and a custom space can coexist in `state.spaces` without either UI corrupting the other's state.
