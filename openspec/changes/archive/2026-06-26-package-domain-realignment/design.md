## Context

The package DAG `geometry → catalog → assembly → packer → store → web` is lint-enforced, but symbol naming and package contents drifted from the DAG's intent during pre-realignment exploration.
Two collisions sit one DAG layer apart: `BinSpec` and `Unit`.
Sketch/Feature CAD scaffolding, dead solver state, and an orthogonal openGrid printer-bed calculator remain in `assembly`, `store`, and `web` even though the storage-layout spec — the only product-facing capability — does not reference any of them.
The package `src/AGENTS.md` "Type Ownership" sections list types that no longer exist (`packer`: `PackerOptions`/`PlacementResult`/`Node`) or omit types that do (`assembly`: Sketch/Feature exports).

Current data flow after the realignment (golden path only):

```
catalog (BinSpec, BinId)
   |
   |  findBinById(ALL_BINS, binId(c.binId))
   v
assembly (BinSpec packer-input shape, SpaceTemplate, SpaceConstraint, SpaceInstance, PackingResult)
   |
   |  toPackerBinSpec(catalog.BinSpec): assembly.BinSpec
   v
packer (packSpace)
   |
   |  PackingResult
   v
store (selectPackedLayout, selectPackingResultsBySpace)
   |
   v
web (BOMPanel, SketchCanvas+FeatureTree dead branch)
```

Target data flow after this change:

```
catalog (BinSpec, BinId)             <-- single canonical product type
   |
   |  findBinById(ALL_BINS, binId(c.binId))
   v
assembly (SpaceTemplate, SpaceConstraint, SpaceInstance, PackingResult, PlacedBin, BOM)
   |
   |  toPackInput(catalog.BinSpec): packer.PackInput
   v
packer (PackInput, packSpace)        <-- packer owns its input shape
   |
   |  PackingResult
   v
store (selectPackedLayout, selectPackingResultsBySpace)
   |
   v
web (GoldenPathSetup, Toolbar, BOMPanel, canvas/*)
```

## Goals / Non-Goals

**Goals:**

- Make `BinSpec` mean exactly one thing (the catalog product spec) and `Unit` mean exactly one thing per layer (the geometry measurement brand).
- Move the packer's input shape under `packages/packer` where it belongs, owning the type its public entry point consumes.
- Delete every export in `assembly`, `store`, and `web` that the storage-layout spec does not reach, after preserving the deletion target with a recovery tag.
- Bring each `packages/<pkg>/src/AGENTS.md` "Type Ownership" list into exact agreement with the package's exported types so weaker agents have a reliable map.
- Add a guardrail (engineering-standards requirement plus a test) that detects future cross-layer name collisions before they ship.

**Non-Goals:**

- No change to the storage-layout requirements themselves; behavior is preserved.
- No change to `packages/geometry` source files.
- No reintroduction of the deleted surface under new names — anything restored later must come back through a new OpenSpec capability proposal.
- No reshape of `catalog.BinSpec` itself (its branded `BinId`, dimensions, price, vendor metadata stay as-is).
- No move of catalog data (Schaller, Gridfinity, Akromils) — only types and lookups in scope.

## Decisions

### D1 — Rename `assembly.BinSpec` to `packer.PackInput` and move it to `packages/packer/src/`

The packer-input shape (`{id, w, l, h, optional tolerances}`) describes the bare numbers `packSpace` needs.
It belongs in `packages/packer` next to `packSpace`, not in `assembly` which models the assembly domain.
`assembly` already imports `catalog` types it transforms; once `PackInput` moves down to `packer`, `assembly` no longer needs to know the packer's input type.
The conversion helper `toPackerBinSpec` becomes `toPackInput` and moves from `packages/store/src/layoutSelectors.ts` to `packages/packer/src/PackInput.ts` so the conversion lives with the type.
Store consumes `findBinById` and calls `toPackInput`; that import is allowed by the DAG (`store > packer > catalog`).

Zod schema for the new type:

```ts
export const PackInputSchema = z
  .object({
    id: z.string(),
    w: z.number().positive(),
    l: z.number().positive(),
    h: z.number().positive(),
    toleranceW: z.number().nonnegative().optional(),
    toleranceL: z.number().nonnegative().optional(),
    toleranceH: z.number().nonnegative().optional(),
  })
  .readonly();

export type PackInput = z.infer<typeof PackInputSchema>;
```

Note: existing `assembly.BinSpec` uses a plain `string` id; `PackInput.id` keeps the plain string for now (it is a packer-internal id, not the branded catalog `BinId`) but is documented as "the catalog `BinId` carried through as a string".

### D2 — Delete `assembly.Unit` (cabinet domain object), keep `geometry.Unit` (measurement brand)

`assembly.Unit` (toolChest/bookshelf/cabinetSystem/garageShelving/entryway/custom with `outerW`, `outerH`, `outerD`, `wallThickness`, `pillarWidth`, `backWallThickness`, `backMaterial`, `spaces`, `shelfPositions`) is exploratory furniture-cabinet modeling that the storage-layout spec does not reach.
Verify no caller reads it; if anything does, it is dead.
Delete the file along with its Zod schemas.
Geometry's `Unit` (numeric brand) remains the only `Unit` symbol in the codebase.

### D3 — Prune CAD/sketching scaffolding from `assembly`, `store`, `web`

Delete:

- `packages/assembly/src/{Sketch2D,SketchElement,SketchElementId,SketchId,Feature}.ts`
- `packages/store/src/StoreTypes.ts` and `useStore.ts`: fields `sketches`, `timeline`, `activeSketchId`, `activeFeatureId`, `pan`; actions `addSketch`, `addFeature`, `addElementToActiveSketch`, `setActiveSketchId`, `setActiveFeatureId`, `setPan`; corresponding persist `partialize` entries
- `apps/web/src/ui/{FeatureTree,FeatureItem,SketchCanvas,SketchCanvasDrawing,SketchCanvasHooks,useSketchCanvasData}.{ts,tsx}` and `apps/web/src/ui/constraints/ConstraintEditor.tsx`
- Any `ToolMode` values exclusive to sketching (`draw_line`, `draw_rect`, etc.) and the `Toolbar` buttons that select them — keep `ToolMode` only if at least one non-sketching mode remains

The canvas surface in `App.tsx` switches from rendering `SketchCanvas + FeatureTree` to rendering a placeholder "Layout view" that hosts the existing `canvas/GridVisualizer`-style display for the packed `PackingResult` (the same renderer the E2E test already drives).
This intentionally narrows the canvas to the storage-layout slice; richer canvas interaction returns through a new capability spec.

### D4 — Prune dead solver state from `store`

Delete fields `solverFeasibility`, `solverConflicts`, `solverSuggestedCounts` and the matching `setSolverFeasibility`, `setSolverConflicts`, `setSolverSuggestedCounts` actions from `packages/store/src/StoreTypes.ts` and `useStore.ts`.
No reader exists since the solver package was removed; verify with `rg`.

### D5 — Prune openGrid printer-bed calculator from `store` and `web`

Delete state `spatialInputs`, `printerBedSize`, `calculationMode` and actions `setSpatialInputs`, `setPrinterBedSize`, `setCalculationMode` from the store.
Delete `apps/web/src/ui/SpatialModelingPanel.tsx` and remove the "Spatial" tab from `App.tsx`.
Keep `packages/geometry/src/OpenGrid.ts` untouched — it is pure math the future capability would need — but no longer re-exported from package roots if it currently is.

### D6 — Refresh package `src/AGENTS.md` Type Ownership

After the deletions, each `packages/<pkg>/src/AGENTS.md` "Type Ownership" list must equal `bun run -e "console.log(...)"`-style extraction of exported types — but since memory rules forbid piping bd/openspec into bun, the verification is a small test in `packages/<pkg>/test/exports.test.ts` (or one shared test in the repo root) that reads the AGENTS.md file, parses the bullet list, and asserts equality against the runtime-imported exports.
Decision: one shared test in `packages/store/test/package-manifest.test.ts` (store can import all packages below it; reuses the lint-enforced DAG).

### D7 — Add cross-layer name-collision guard to engineering-standards

Add a requirement to `openspec/specs/engineering-standards/spec.md`:

> The codebase SHALL NOT export the same exported type name from more than one package in the DAG.

Verified by a new test in `packages/store/test/package-manifest.test.ts` (reuses D6 infrastructure) that scans the exported type names of every package and fails if any name appears in two packages.

### D8 — Recovery tag for deleted surface

Before slice 2 deletions land in `main`, push a git tag `pre-package-prune` on the parent commit of the deletion.
Recorded in proposal Success Criteria and in retrospective Promote section.

## Risks / Trade-offs

- **`PackInput` rename ripples through every test that constructs an assembly `BinSpec`.** Mitigation: do the rename in a single mechanical PR (no other changes) so the diff is reviewable as pure renames; CI must pass on green tests before any deletion lands.
- **The pruned UI surface looks like a regression to anyone who remembered the sketching tab.** Mitigation: the recovery tag plus a sentence in `AGENTS.md` "Recently removed (see tag `pre-package-prune`): ..." preserves discoverability.
- **The package-manifest test couples AGENTS.md to runtime exports.** If a future capability adds exports and forgets to update AGENTS.md, the test fails. Trade-off accepted: that failure is exactly what we want; the alternative (no test) is what got us into this proposal.
- **Slicing the change into separate PRs vs one large PR.** Per project convention "commit immediately after every closed Bead", each task is its own commit, but multiple tasks can ride one PR per slice. Plan: PR per slice (collisions, prune, refresh+guard) keeps reviewer load bounded.
- **`assembly` may have indirect references to the deleted types through `Project` or `Assembly` aggregates.** Mitigation: audit `packages/assembly/src/Project.ts` and `Assembly.ts` first; if they reference Sketch/Feature, decide whether to delete the aggregate too (likely yes — they are themselves exploratory) or keep them with the sketch refs stripped.

## Adversarial Audit

Failure modes and sync conflicts a hostile reviewer would surface:

- **`Project`/`Assembly` types in `packages/assembly/src/` likely embed `Sketch` or `Feature` arrays.** Deleting `Sketch2D` without first deleting `Project.sketches` or equivalent would cause a typecheck cascade across the package. Slice 2 task order must read `Project.ts` and `Assembly.ts` first and either prune their fields or remove them entirely before deleting leaf files.
- **`SpaceInstance` may reference `SketchId` (the bead test seed used `golden-space-1` not a `SketchId`).** Verify with `rg "SketchId" packages/assembly/src/SpaceInstance.ts` before any deletion. If found, the field is dead.
- **`apps/web/src/ui/App.tsx` defaults to the "canvas" tab which renders `SketchCanvas`.** Removing `SketchCanvas` without replacing the canvas tab body will produce a runtime error on first paint. The new "Layout view" body must land in the same PR slice as the SketchCanvas deletion.
- **`useStore` persist `partialize` lists `sketches`, `timeline`, etc.** Stale persisted data in users' IndexedDB will still contain those fields. Hydration with extra unknown fields is harmless for Zustand (extras are dropped on next persist), but verify by clearing the dev DB or by adding a version bump to the persist config.
- **`packer/src/AGENTS.md` claims it owns `PackerOptions`/`PlacementResult`/`Node`.** These are aspirational names from earlier design. The slice 3 task to refresh AGENTS.md must replace them, not add to them, otherwise the package-manifest test will fail on its first run.
- **The package-manifest test reads `AGENTS.md`, which is markdown.** Brittle bullet-list parsing will reject legitimate edits. Mitigation: parse a fenced code block tagged ` ```ts-exports ` instead of free-form bullets, or use a JSON sidecar `exports.json`; decide during task implementation, but the test must be tolerant of cosmetic markdown edits.
- **Lint enforces the DAG via `eslint.config.ts` `dagBoundaries`. Moving the packer input from `assembly` to `packer` is downward in the DAG and allowed; importing `catalog.BinSpec` from `packer` (for the `toPackInput` helper) is also allowed.** Verify the helper sits in a file the lint config does not exclude.
- **The cross-layer name-collision guard will fire on legitimate cases I have not enumerated (e.g., `Schema` re-exports, `Id` brand suffixes).** Mitigation: the guard targets exported types only and ignores names ending in `Schema` (the Zod schema convention) and `Id` brand pairs by default; document this in the spec requirement so future readers know the scope.
