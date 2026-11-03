# store/

## Responsibility

This package manages the global application state using Zustand. It acts as the bridge between pure logic and the React UI layer.

## Type Ownership

```ts-exports
AppState
ComparableStorageSystem
LayoutInputs
LayoutResolution
Sketch
SolverRunState
SolverWorkerEvent
SpaceInputs
StoreState
ToolMode
applySolverEventInState
applyStrategyInState
buildAutoFillConstraints
clearSolverStateInState
initialState
isBinInstallationAllowed
parseSketch
removeConstraintFromState
selectActiveSolverRun
selectOptionsModeStrategies
selectPackedLayout
selectPackingResultsBySpace
selectSolverRun
serializeSketch
setTemplateDrillableInState
setTemplateMaxWeightLbsInState
setTemplateRailPresentInState
startSolverRunInState
updateConstraintInState
useStore
```

## Import Rules

- **May import from**: `geometry/`, `catalog/`, `assembly/`, `packer/`
- **Must not import from**: `web/`
- **Other rules**: Do not expose `set` or mutate functions directly to the UI. Define explicit actions (commands) for all state changes. Keep selectors fast.
