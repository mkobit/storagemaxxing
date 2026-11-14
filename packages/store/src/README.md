# Store source (`packages/store/src`)

## Overview

Provides the Zustand application store (`useStore`) persisted to IndexedDB alongside pure state mutation helpers, layout and packing selectors, solver worker event reducers, and Zod-validated sketch serialization.

## Interface

- `Sketch`, `serializeSketch`, `parseSketch` (`SketchSerialization.ts`) — Sketch schema type and JSON serialization/validation helpers.
- `updateConstraintInState`, `removeConstraintFromState`, `applyStrategyInState`, `setTemplateDrillableInState`, `setTemplateRailPresentInState`, `setTemplateMaxWeightLbsInState` (`StoreHelpers.ts`) — Pure state transition helpers for constraints, strategies, and template installation flags.
- `AppState`, `StoreState`, `initialState` (`StoreTypes.ts`) — Store state interfaces and initial state constant.
- `ToolMode` (`ToolMode.ts`) — Tool mode union type.
- `isBinInstallationAllowed`, `LayoutInputs`, `SpaceInputs`, `LayoutResolution`, `selectPackedLayout`, `ComparableStorageSystem`, `buildAutoFillConstraints`, `selectOptionsModeStrategies`, `selectPackingResultsBySpace` (`layoutSelectors.ts`) — Installation filtering, packing resolution, auto-fill constraint builders, and strategy selectors.
- `SolverWorkerEvent`, `SolverRunState`, `startSolverRunInState`, `applySolverEventInState`, `clearSolverStateInState`, `selectSolverRun`, `selectActiveSolverRun` (`solverActions.ts`) — Solver worker event types, state reducers, and selectors.
- `useStore` (`useStore.ts`) — Zustand store hook with IndexedDB persistence.

## Invariants

- `parseSketch` (`SketchSerialization.ts`) validates parsed JSON against `SketchSchema` (`readonly` `spaces`, nullable `activeSpaceId`, `readonly` `templatesById`, `readonly` `constraintsBySpace`).
- `updateConstraintInState` and `removeConstraintFromState` (`StoreHelpers.ts`) keep `constraintsBySpace[templateId]` and `space.constraints` on every `SpaceInstance` with matching `templateId` synchronized.
- `setTemplateMaxWeightLbsInState` (`StoreHelpers.ts`) retains the `maxWeightLbs` constraint only when `maxWeightLbs !== undefined && maxWeightLbs > 0`.
- `isBinInstallationAllowed` (`layoutSelectors.ts`) blocks drill bins when `noDrill` is present and blocks rail bins unless `railPresent` is present.
- `resolveSpace` (`layoutSelectors.ts`) filters disallowed bins out of both `fittingConstraints` and `bins` before calling `packSpace` so excluded hard constraints do not cause spurious placement failures.
- `applyWeightOverflow` (`layoutSelectors.ts`) appends a weight-overflow failure when `maxWeightLbs` is set and placed bin weight exceeds `maxWeightConstraint.value`.
- `applySolverEventInState` (`solverActions.ts`) ignores events whose `requestId` does not match `solverRunsBySpace[target].requestId`, and deletes `solverResultsBySpace[target]` on error events.
- `useStore` (`useStore.ts`) invalidates `solverResultsBySpace` for all spaces sharing a mutated `templateId` on constraint, installation-constraint, or strategy updates, clears all solver state on `loadSketch`, and persists only `_hasHydrated`, `mode`, `spaces`, `activeSpaceId`, `templatesById`, and `constraintsBySpace` via `partialize`.

## Side effects

- `idbStorage` (`useStore.ts`) reads, writes, and deletes persisted store state in IndexedDB under `"storagemaxxing-db"` via `idb-keyval` when `indexedDB` is defined.
- `useStore` (`useStore.ts`) invokes `state?.setHasHydrated(true)` in the `onRehydrateStorage` callback.
- `parseSketch` (`SketchSerialization.ts`) throws on malformed JSON or Zod validation failure.

## Verification

- Run: `bun test packages/store`
