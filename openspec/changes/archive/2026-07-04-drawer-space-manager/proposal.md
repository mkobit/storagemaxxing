## Why

Users can only create a space by clicking one of four hardcoded preset buttons in `GoldenPathSetup` (12x12, 2x2, a partial-constraint demo, and an unresolved-bin demo).
None of these accept a user-chosen size, and the storage system selector already renders as a dropdown but only ever offers "gridfinity".
The store already supports multiple spaces (`state.spaces`, `addSpace`, `setActiveSpace`) and `selectPackingResultsBySpace` already resolves each space independently, but no UI in `apps/web` lets a user create an arbitrarily-sized space or switch which one is active once more than one exists.
sm-5po5 asks for exactly this: type dimensions, pick a system, create a space, and switch between spaces.

## What Changes

- Add a "Space manager" UI surface where a user enters columns, rows, and depth/height, picks a storage system from the existing `StorageSystem` enum, and clicks "Create space" to add a new `SpaceTemplate` + `SpaceInstance` to the store and make it active.
- List existing spaces (by name) with a way to switch `activeSpaceId` between them.
- No changes to `packages/geometry`, `packages/catalog`, `packages/packer`, or `packages/assembly`/`packages/store` domain types — this reuses `createSpaceTemplate`, `SpaceInstanceSchema`, `addTemplate`, `addSpace`, and `setActiveSpace` exactly as `GoldenPathSetup` does today.
- `GoldenPathSetup`'s preset buttons are unaffected; the new panel is additive and sits alongside it in the toolbar area.

## Capabilities

### New Capabilities

- `drawer-space-manager`: user-driven creation of custom-dimensioned spaces and switching between existing spaces, built entirely on already-existing store actions and assembly domain types.

### Modified Capabilities

(none — `storage-layout` requirements are unchanged; this change only adds a new UI entry point that produces the same `SpaceTemplate`/`SpaceInstance` shapes the golden path already produces)

## Impact

- Affected package: `apps/web` only (new component(s) under `apps/web/src/ui/`, wired into `Toolbar.tsx` or `App.tsx`).
- No new packages, no changes to the package DAG, no new persistence format (space creation goes through the same `addTemplate`/`addSpace` actions already covered by `packages/store`'s sketch serialization).
- New Playwright e2e coverage for the create-space and switch-space flows; no changes to existing e2e specs expected.

## Success Criteria

- A user can type custom dimensions (e.g. 5 columns, 4 rows) and a depth/height, select a storage system, click "Create space", and see the canvas immediately render that space as the active layout — satisfying sm-5po5's acceptance criterion verbatim.
- With two or more spaces created, a user can select a different space from the manager and the canvas/BOM update to reflect that space as active.
- `bun run lint`, `bun run typecheck`, and `bun test` all pass with no changes needed outside `apps/web`.
