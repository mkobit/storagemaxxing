## Context

The current user interface in `apps/web/src/ui/spaceManager/CreateSpaceForm.ts` supports only rectangular spaces with fixed numeric dimensions.
Real storage enclosures feature irregular geometries, structural obstacles, and diverse access orientations.
This design introduces an Autodesk Fusion-adapted CAD modeling workflow in `apps/web`.
The modeler enables users to sketch footprints on an orthographic grid, extrude voids to 3D via gizmo manipulation, and assign semantic face roles.
The design cleanly separates browser CAD interaction from combinatorial packing solvers in `packages/packer`.

## Goals / Non-Goals

**Goals:**

- Provide a 2D orthographic canvas with dynamic Cartesian tape-measure grid lines and magnetic snapping.
- Provide a floating dimension HUD that supports fractional inch, decimal inch, and millimeter inputs.
- Provide an interactive 3D normal extrusion arrow gizmo with real-time height preview.
- Enable direct interactive face role assignment for access faces, gravity faces, obstacles, and dividers.
- Export an immutable, Zod-validated `SpaceTemplate` contract to the store and downstream solvers.

**Non-Goals:**

- Full boundary representation (B-Rep) solid modeling or NURBS surfaces.
- Parametric constraint solver engines (e.g., geometric 2D constraint networks like SolveSpace).
- Running bin packing algorithms inside the CAD interaction render loop.

## Decisions

### 1. Data flow architecture

```ascii
+--------------------------------------------------------------------+
| Space Modeler CAD UX (apps/web)                                    |
| 1. 2D sketch on orthographic grid with dynamic tape measure        |
| 2. Floating dimension HUD with fractional keyboard entry           |
| 3. Extrusion to 3D void via normal arrow drag gizmo                |
| 4. Interactive face role assignment (access, gravity, obstacles)   |
+--------------------------------------------------------------------+
                                  |
                                  | Emits immutable SpaceTemplate JSON
                                  v
+--------------------------------------------------------------------+
| SpaceTemplate contract (packages/assembly, packages/geometry)      |
| - 2D polygon footprint or bounding box                             |
| - 3D extrusion height and normal                                   |
| - Access face and reach clearance buffer                           |
| - Obstacles, dividers, and installation constraints                |
+--------------------------------------------------------------------+
                                  |
                 +----------------+----------------+
                 |                                 |
                 v                                 v
+--------------------------------+ +--------------------------------+
| Layer 1 MaxRects solver        | | Layer 2 OR-Tools CP-SAT solver |
| (packages/packer synchronous)  | | (Web Worker WASM via sm-54wg.4)|
+--------------------------------+ +--------------------------------+
```

### 2. Viewport projection and interaction states

The modeler employs two distinct viewport projection states:

1. `Sketch2D`: Orthographic camera projection aligned with the normal vector of the active plane.
2. `Extrude3D`: Axonometric 30-degree isometric elevation for extrusion and face role inspection.

Interaction state machine:

```
Idle -> Sketching2D -> DimensionHudActive -> Extrude3D -> FaceRoleAssignment -> EmittingTemplate -> Idle
```

HUD keyboard controls:

- `Tab`: Cycle focus between active dimension fields.
- `Enter`: Commit dimension value and place geometry.
- `Escape`: Cancel current drag or dismiss HUD.

### 3. Domain objects and Zod schemas

The modeler serializes spaces into the `SpaceTemplate` schema matching `packages/assembly/src/SpaceTemplate.ts`.

```typescript
import { z } from "zod";

export const CadPoint2DSchema = z.tuple([z.number(), z.number()]);
export type CadPoint2D = z.infer<typeof CadPoint2DSchema>;

export const CadObstacleSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string(),
    x: z.number(),
    y: z.number(),
    z: z.number(),
    w: z.number(),
    l: z.number(),
    h: z.number(),
    permanent: z.boolean().default(true),
  })
  .readonly();

export const CadExtrusionSchema = z
  .object({
    height: z.number().positive(),
    normal: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 1]),
  })
  .readonly();
```

### 4. Solver boundary and worker messaging

The CAD modeler emits an immutable `SpaceTemplate` without performing combinatorial bin packing.
Solvers receive the `SpaceTemplate` payload through an asynchronous worker boundary:

```typescript
export type SolverWorkerRequest = {
  readonly type: "SOLVE_SPACE";
  readonly requestId: string;
  readonly spaceTemplate: unknown;
  readonly catalogBins: readonly unknown[];
  readonly userConstraints: readonly unknown[];
  readonly timeLimitMs?: number;
};
```

## Risks / Trade-offs

- **[Risk]**: Complex polygon footprints can increase hit-test and point-in-polygon computational latency.
- **[Mitigation]**: Precompute axis-aligned bounding boxes (AABB) in `packages/geometry` to prune invalid placement tests before polygon checks.
- **[Trade-off]**: Restricting extrusion to single-axis normals prevents arbitrary non-planar lofts.
- **[Mitigation]**: Storage spaces in practice are 2.5D extruded prismatic voids, so single-axis normal extrusion satisfies all practical storage layouts.

## Adversarial audit

- **[Failure mode]**: User draws a self-intersecting polygon loop.
- **[Fix]**: The sketch controller tests for edge-edge intersections before closing a loop and refuses extrusion if self-intersections exist.
- **[Failure mode]**: Extrusion height exceeds physical reach or zero height is entered.
- **[Fix]**: Zod schema validation enforces `height > 0` and rejects non-positive dimensions.
- **[Sync conflict]**: Multiple components attempt to mutate space geometry simultaneously.
- **[Fix]**: Geometry updates pass through atomic Zustand store actions in `packages/store`, producing immutable state snapshots.
