## Why

The package layers drifted from their DAG roles during earlier exploratory work, and the storage-layout realignment did not catch the residue.
Two symbol-name collisions sit in adjacent DAG layers: `BinSpec` means a rich catalog product in `packages/catalog` and a minimal packer input in `packages/assembly`, and `Unit` means a numeric measurement brand in `packages/geometry` and a furniture-cabinet domain object in `packages/assembly`.
Weaker agents reading these packages cannot disambiguate without tracing every import, and the stringly-typed `BinSpec.id` in `assembly` is exactly the kind of weakly-modeled boundary the coding philosophy memo warns against.
Beyond the collisions, `packages/assembly`, `packages/store`, and `apps/web` still carry pre-realignment scaffolding — CAD-style `Sketch`/`Feature` types and panels, dead solver state from a deleted package, and an orthogonal openGrid printer-bed calculator — none of which the storage-layout spec references.
Each package's `src/AGENTS.md` "Type Ownership" lists also no longer match the actual exports.
Pruning this surface now keeps the package boundaries readable for both humans and agents and lets future capabilities (a sketching mode, a printer-bed calculator, a solver layer) re-enter as their own specs instead of as inherited dead code.

## What Changes

- Move the packer-input shape currently in `packages/assembly/src/BinSpec.ts` into `packages/packer/src/` under a new name (`PackInput`) so `BinSpec` refers only to the catalog product spec in `packages/catalog/src/bin.ts`.
- Rename `packages/assembly/src/Unit.ts` (cabinet domain object) to `StorageUnit` so `Unit` refers only to the measurement brand in `packages/geometry/src/Unit.ts`; delete the cabinet type if no caller in the storage-layout slice references it after slice 2 pruning.
- Delete CAD/sketching scaffolding not referenced by the storage-layout spec: in `packages/assembly` (`Sketch2D`, `SketchElement`, `SketchElementId`, `SketchId`, `Feature`), in `packages/store` (`sketches`, `timeline`, `activeSketchId`, `activeFeatureId`, `pan` fields and their actions), and in `apps/web/src/ui` (`FeatureTree`, `FeatureItem`, `SketchCanvas`, `SketchCanvasDrawing`, `SketchCanvasHooks`, `useSketchCanvasData`, `constraints/ConstraintEditor`).
- Delete dead solver state from `packages/store/src/StoreTypes.ts` and `useStore.ts`: `solverFeasibility`, `solverConflicts`, `solverSuggestedCounts` and their setter actions (the solver package is gone).
- Delete the orthogonal openGrid printer-bed capability not referenced by storage-layout: `spatialInputs`, `printerBedSize`, `calculationMode` state and actions in the store, `SpatialModelingPanel` in the web app, and the supporting `OpenGrid` re-exports from the geometry public surface if no other caller remains.
- Tag the pre-deletion commit so the removed surface stays recoverable when it re-enters as its own capability.
- Refresh `packages/{assembly,catalog,geometry,packer,store}/src/AGENTS.md` so "Type Ownership" lists exactly match the package exports after the above changes, and so "Import Rules" reflect the lint-enforced DAG.

## Capabilities

### New Capabilities

(None — this change tightens the existing package surface and the storage-layout slice.)

### Modified Capabilities

- `storage-layout`: the "Store Layout Derivation" requirement's plumbing changes (`toPackerBinSpec` returns `PackInput` instead of an `assembly` `BinSpec`), but the behavioral assertion is unchanged; add a Scenario clarifying that the store selector consumes the catalog `BinSpec` and produces packer `PackInput` so the type boundary is explicit.
- `engineering-standards`: add a requirement forbidding identically-named exported types in different DAG layers, verified by a lint rule or a test that walks package exports.

## Impact

- Affected packages in the DAG: `catalog`, `assembly`, `packer`, `store`, `web`. `geometry` untouched.
- Affected tests: `packages/store/test/golden-path.test.ts` (uses `toPackerBinSpec`), web unit tests, and the golden-path E2E spec all stay green; they assert behavior, not type names.
- Affected docs: every package `src/AGENTS.md` plus a project-level note in `AGENTS.md` if the engineering-standards rule lands.
- Recovery path: a `pre-prune-archive` git tag (or branch) preserves the deleted sketching/solver/openGrid surface so a future capability spec can lift it back in instead of rewriting from scratch.

## Success Criteria

- Exactly one exported `BinSpec` symbol remains in the codebase, in `packages/catalog/src/bin.ts`.
- Exactly one exported `Unit` symbol exists per DAG layer, with non-overlapping meanings (geometry: measurement brand; assembly: gone or renamed `StorageUnit`).
- `rg "(Sketch|Feature|solver|Spatial)" packages/ apps/web/src/ --type ts --type tsx` returns only deliberate domain matches (no leftover CAD/solver/openGrid scaffolding).
- Each `packages/<pkg>/src/AGENTS.md` "Type Ownership" list is exactly the set of exported types in that package.
- `bun run lint && bun run typecheck && bun run test && bun run --filter @storagemaxxing/web e2e` all pass on a clean tree.
- A recovery tag (`pre-package-prune`) exists on the commit immediately before the slice-2 deletions.
