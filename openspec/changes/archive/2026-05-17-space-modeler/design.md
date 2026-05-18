## Context

The current StorageMaxxing prototype uses hardcoded rectangular dimensions for drawers. This design establishes the core geometric primitives and data models needed to represent real-world storage geometry, including irregular footprints and access-based constraints.

## Goals / Non-Goals

**Goals:**
- Enable non-rectangular space modeling via 2D polygons.
- Formalize the `SpaceTemplate` and `SpaceInstance` separation.
- Implement access-aware visibility rules (Top vs. Front access).
- Provide a Zod-validated persistence layer for space definitions.

**Non-Goals:**
- 3D Mesh modeling (restricted to 2D footprints with 1D height).
- Complex curved surfaces (approximated by high-vertex polygons).

## Decisions

### 1. Data Flow Architecture

```ascii
[ User UI ] <--> [ Canvas Interaction ]
      |                 |
      v                 v
[ Store ] <---- [ Geometry Package ]
      |         (Polygon Math)
      v
[ Packer ] <--- [ Solver ]
(Placement)      (Validation)
```

### 2. Domain Objects (Zod Schemas)

```typescript
import { z } from 'zod';

export const Point2DSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const AccessFaceSchema = z.enum(['top', 'front', 'top+front', 'all-sides']);

export const ObstacleSchema = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  l: z.number(),
  label: z.string()
});

export const SpaceTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  accessFace: AccessFaceSchema,
  w: z.number().optional(),
  l: z.number().optional(),
  h: z.number(),
  footprint: z.array(Point2DSchema).optional(), // Polygon vertices
  obstacles: z.array(ObstacleSchema).default([])
});
```

### 3. Polygon Intersection Logic
To handle packing in non-rectangular spaces, the `packages/packer` will use a **Point-in-Polygon** test to validate that all four corners of a placed bin fall within the `footprint` and outside all `obstacles`.

## Risks / Trade-offs

- **[Risk]**: Polygon intersection math is more computationally expensive than AABB checks.
- **[Mitigation]**: Pre-calculate the bounding box of the footprint to quickly discard obviously invalid placements before running precise polygon checks.
- **[Trade-off]**: Using high-vertex polygons for curves increases state size.
- **[Mitigation]**: Implement a vertex simplification utility in `packages/geometry` to keep polygon complexity manageable.

## Adversarial Audit

- **[Failure Mode]**: User defines a self-intersecting polygon.
- **[Fix]**: The `SpaceTemplateSchema` will include a refinement to validate polygon simplicity using the `packages/geometry` validation logic.
- **[Sync Conflict]**: Two agents modifying the same `SpaceTemplate`.
- **[Fix]**: Metadata in `SpaceInstance` will track the last known template version; Beads will claim specific geometry implementation tasks to prevent overlap.
