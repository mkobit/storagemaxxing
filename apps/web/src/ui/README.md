# Web UI

## Overview

Implements the Storagemaxxing React UI shell, layout canvas, constraint editor, Bill of Materials (BOM) view, strategy options comparison, and supporting visualization utilities.

## Interface

- `[App.tsx:App]` `React.FC` rendering `AppHeader`, tab switcher (`"layout" | "bom" | "options"`), `ConstraintEditorPanel`, `LayoutCanvas`, `BOMPanel`, and `OptionsPanel`.
- `[AppHeader.tsx:AppHeader]` `React.FC` rendering `SpaceManager`, Export/Import sketch JSON controls, `DevToolsMenu`, and `ThemeToggle`.
- `[BOMPanel.tsx:BOMPanel]` `React.FC` computing aggregate BOM from resolved packing results and rendering `BOMTable`.
- `[ConstraintEditorPanel.tsx:ConstraintEditorPanel]` `React.FC` for editing active space installation constraints, bin/accessory constraints, and searching/adding compatible catalog items.
- `[DevToolsMenu.tsx:DevToolsMenu]` `React.FC` wrapping `GoldenPathSetup` in a `<details>` menu.
- `[GoldenPathSetup.tsx:GoldenPathSetup]` `React.FC` with system selector and starter layout preset buttons.
- `[LayoutCanvas.tsx:LayoutTransform, LayoutCanvas.tsx:drawSpaceBounds, LayoutCanvas.tsx:LayoutCanvas]` Canvas layout component, bounds drawing helper, and transform type.
- `[Toolbar.tsx:ToolbarProps, Toolbar.tsx:Toolbar]` Interactive mode/zoom/wireframe toolbar component and props type.
- `[binColorPalette.ts:binColorForIndex]` Function `(index: number) => string` cycling through `BIN_COLOR_PALETTE`.
- `[viewportFit.ts:ViewportFit, viewportFit.ts:computeViewportFit, viewportFit.ts:computeLayoutBounds]` Pure 2D viewport fitting and layout bounding box helpers.
- `[wireframeScene.ts:WireframeScene, wireframeScene.ts:buildWireframeScene]` Cabinet-projected 3D wireframe scene builder.
- Storybook meta and story exports in `AppHeader.stories.tsx`, `BOMPanel.stories.tsx`, `ConstraintEditorPanel.stories.tsx`, `DevToolsMenu.stories.tsx`, `GoldenPathSetup.stories.tsx`, `LayoutCanvas.stories.tsx`, and `Toolbar.stories.tsx`.
- Subdirectories:
  - [BOM UI](./bom/README.md) — Bill of materials table, row/header/summary components, and CSV export.
  - [Constraints UI](./constraints/README.md) — `ConstraintRow` and `ConstraintInputs` components for editing bin constraint modes and bounds.
  - [Options UI](./options/README.md) — `OptionsPanel`, `StrategyCard`, and `toCardMetrics` for comparing storage strategies.
  - [Space manager UI](./spaceManager/README.md) — `CreateSpaceDialog`, `CreateSpaceFormPanel`, `SpaceSwitcher`, and `SpaceManager` components plus `CreateSpaceInputSchema`.
  - [Theme UI](./theme/README.md) — `ThemeProvider`, `ThemeToggle`, `ThemeContext`, and `useTheme` for light/dark/system themes.

## Invariants

- `[App.tsx:App]` Renders `"Loading..."` until `useStore((state) => state._hasHydrated)` is `true`.
- `[BOMPanel.tsx:BOMPanel]` Only includes space packing resolutions where `resolution.kind === "resolved"` when calling `computeAggregateBom`.
- `[ConstraintEditorPanel.tsx:ConstraintEditorPanel]` Renders `"No active space selected"` when no space matches `state.activeSpaceId`; resolves `detectedSystem` in order: `activeSpace.system`, first constraint's `binDef.system`, `"akromils"` or `"schaller"` case-insensitive substring in `activeSpace.templateId`/`name`, else `"gridfinity"`.
- `[ConstraintEditorPanel.tsx:ConstraintEditorPanel]` Derives `drillable` as `!installationConstraints.some((c) => c.type === "noDrill")` and disables catalog item add button when `isAdded || !isBinInstallationAllowed(item, installationConstraints)`.
- `[GoldenPathSetup.tsx:GoldenPathSetup]` `system-select` `onChange` only sets system when `e.target.value === "gridfinity"`.
- `[LayoutCanvas.tsx:LayoutCanvas]` Zoom level is clamped to `[0.25, 4]` via `Math.min(z * 1.25, 4)` and `Math.max(z / 1.25, 0.25)`.
- `[LayoutCanvas.tsx:ResolvedCanvas]` Mouse drag panning only activates and emits `onPanChange` when `mode === "pan"`.
- `[LayoutCanvas.tsx:drawSpaceBounds]` Returns early if `template.w` or `template.l` is undefined; draws reach clearance only when `template.backClearance !== undefined && template.backClearance > 0`.
- `[LayoutCanvas.tsx:drawPackedLayout]` Skips placed bins whose `lookupBin(placed.binId)` returns `undefined`.
- `[LayoutCanvas.tsx:selectDisplayedSolverRun]` Returns `undefined` when a solver run has `status === "solved"` but `state.solverResultsBySpace[run.spaceId]` is `undefined`.
- `[viewportFit.ts:computeViewportFit]` Clamps available viewport width/height to at least 1 px and falls back to `scale = 1` if both bounding box dimensions are `<= 0`.
- `[viewportFit.ts:computeLayoutBounds]` Filters out unresolved bins and non-finite `Rect2D`s (`isFiniteRect`) before unioning so `NaN`/non-finite placements do not poison `Math.min`/`Math.max`.
- `[wireframeScene.ts:compareBackToFront]` Orders placed bins back-to-front by descending `origin[2]`, ascending `origin[0]`, then `binId.localeCompare`.
- `[wireframeScene.ts:computeBoundingBox]` Filters out non-finite projected points (`isFinitePoint`) before computing bounds and returns a `0x0` `Rect2D` at `(0, 0)` if none remain.
- `[wireframeScene.ts:buildSpaceEdges]` Returns `[]` if `template` is `null` or missing `w`/`l`, and omits top/vertical edges if `h` is undefined.
- `[binColorPalette.ts:binColorForIndex]` Indexes into the 6-color `BIN_COLOR_PALETTE` using `index % BIN_COLOR_PALETTE.length`.

## Side effects

- `[AppHeader.tsx:handleExport]` Reads `useStore.getState()`, creates a Blob object URL via `URL.createObjectURL`, triggers download of `"storagemaxxing-sketch.json"` via temporary `<a>` click, and calls `URL.revokeObjectURL`.
- `[AppHeader.tsx:handleImportFile]` Resets file input value (`e.target.value = ""`), reads `file.text()`, and mutates store via `loadSketch(parseSketch(...))` or sets `importError` state.
- `[ConstraintEditorPanel.tsx:ConstraintEditorPanel]` Mutates store via `updateConstraintForSpace`, `removeConstraintForSpace`, `setSpaceDrillable`, `setSpaceRailPresent`, and `setSpaceMaxWeightLbs` keyed by `activeSpace.templateId`.
- `[GoldenPathSetup.tsx:GoldenPathSetup]` Mutates store via `addTemplate`, `addSpace`, and `setActiveSpace` on starter layout button clicks.
- `[LayoutCanvas.tsx:resolveCanvasToken]` Reads computed CSS custom properties from `document.documentElement` via `getComputedStyle`.
- `[LayoutCanvas.tsx:ResolvedCanvas]` Mutates the `<canvas>` 2D rendering context inside `useEffect` and updates local drag state / invokes `onPanChange` on mouse events.
- `[LayoutCanvas.tsx:SolverStatus]` Calls `useStore` `clearSolverState(run.spaceId)` on button click.
- `[Toolbar.tsx:Toolbar]` Calls `useStore` `setMode("select" | "pan")` on mode button click and invokes optional prop callbacks (`onZoomIn`, `onZoomOut`, `onFit`, `onToggleWireframe`).
- Story decorators in `AppHeader.stories.tsx`, `BOMPanel.stories.tsx`, `ConstraintEditorPanel.stories.tsx`, `GoldenPathSetup.stories.tsx`, `LayoutCanvas.stories.tsx`, and `Toolbar.stories.tsx` mutate global Zustand store state via `useStore.setState(...)`.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
