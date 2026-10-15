## Why

Users currently define storage spaces with simple rectangular numeric inputs.
Real storage spaces have irregular boundaries, obstacles, and different access faces.
Users need a fast CAD sketch workflow to model complex void volumes directly in the browser.
This change establishes an Autodesk Fusion-inspired sketch-to-extrusion CAD interaction flow.
It decouples geometric void modeling in the browser from downstream constraint solving.

## What Changes

- Add a 2D orthographic sketch canvas with an adaptive Cartesian tape-measure grid.
- Add an interactive dimension heads-up display (HUD) with fractional keyboard input.
- Add a 3D extrusion arrow gizmo to extrude 2D closed footprints into 3D void volumes.
- Add an interactive face role assignment flow for access faces, gravity faces, obstacles, and dividers.
- Formalize the serialized `SpaceTemplate` contract emitted by the CAD modeler to downstream solvers.

## Capabilities

### New Capabilities

- `space-modeler-cad-ux`: Browser sketch-to-extrusion CAD modeling interface to create void volumes and emit `SpaceTemplate` definitions.

### Modified Capabilities

- `drawer-space-manager`: Add sketch modeler trigger in the space creation flow alongside dimension inputs.

## Impact

- Affected packages in DAG:
  - `apps/web`: Introduces CAD canvas components, dimension HUD controls, extrusion gizmo, and face role inspector.
  - `packages/geometry`: Exports polygon primitives and camera projection helpers used by the CAD viewport.
  - `packages/assembly`: Emits validated `SpaceTemplate` definitions with extrusion metadata and obstacle bounds.
  - `packages/packer` and `packages/store`: Unaffected by CAD UI rendering; receives immutable `SpaceTemplate` contracts.

## Success Criteria

- Users can sketch 2D closed loops on an adaptive grid with fractional tape-measure rulers.
- Dimension HUD accepts fractional inches, decimal inches, and metric inputs via keyboard navigation.
- Extrusion gizmo provides live interactive 3D preview and snaps to height increments.
- Face role selector tags access faces, gravity faces, and keep-out obstacles.
- Modeler exports valid Zod-parsed `SpaceTemplate` definitions to the store without solver coupling.
