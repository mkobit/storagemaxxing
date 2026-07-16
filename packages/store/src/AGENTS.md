# store/

## Responsibility

This package manages the global application state using Zustand. It acts as the bridge between pure logic and the React UI layer.

## Type Ownership

```ts-exports
AppActions
AppState
LayoutInputs
LayoutResolution
Sketch
SketchSchema
SpaceInputs
StoreState
ToolMode
initialState
isBinInstallationAllowed
layoutResolutionMissingTemplate
layoutResolutionNone
layoutResolutionResolved
parseSketch
selectPackedLayout
selectPackingResultsBySpace
serializeSketch
setTemplateDrillableInState
toSketch
updateConstraintInState
removeConstraintFromState
useStore
```

## Import Rules

- **May import from**: `geometry/`, `catalog/`, `assembly/`, `packer/`
- **Must not import from**: `web/`
- **Other rules**: Do not expose `set` or mutate functions directly to the UI. Define explicit actions (commands) for all state changes. Keep selectors fast.
