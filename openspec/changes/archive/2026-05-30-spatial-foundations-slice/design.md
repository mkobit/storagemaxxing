## Context

The project lacks foundational 2D primitives and a verified static deployment pipeline.
This vertical slice establishes the core geometry logic and the web infrastructure required for all subsequent features (OpenGrid, NeoGrid, etc.).

## Goals / Non-Goals

**Goals:**
- Implement immutable 2D primitives in `packages/geometry`.
- Create a pure functional engine for modeling OpenGrid fill patterns.
- Refactor `apps/web` into a fully static Bun-based application.
- Establish a Cloudflare Pages compatible build pipeline.
- Provide a 2D visualization pane for grid modeling.

**Non-Goals:**
- 3D visualization or CAD-like interactions.
- Complex constraint satisfaction (Layer 2) for this slice.
- Server-side rendering or database persistence.

## Architecture & Data Flow

```ascii
[ User Input (W/H) ] -> [ Web UI (Zustand Store) ]
                                |
                                v
                [ packages/geometry (calculateOpenGrid) ]
                                |
        +-----------------------+-----------------------+
        |                       |                       |
        v                       v                       v
[ Grid Layout ]        [ Efficiency Stats ]    [ Bed Violations ]
        |                       |                       |
        +-----------+-----------+-----------+-----------+
                    |
                    v
            [ 2D Visualization (SVG) ]
```

## Domain Objects & Schemas

### Spatial Primitives

```typescript
import { z } from "zod";

export const UnitSchema = z.enum(["mm", "inch", "unit"]);

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  unit: UnitSchema,
}).readonly();

export const SizeSchema = z.object({
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  unit: UnitSchema,
}).readonly();

export const RectSchema = z.object({
  origin: PointSchema,
  size: SizeSchema,
}).readonly();

export const PrinterBedSchema = z.object({
  size: SizeSchema,
  name: z.string().optional(),
}).readonly();
```

## Decisions

### 1. Static-Only Build via Bun
We will use `bun build` to target the web browser directly, producing a zero-dependency `dist` folder.
This maximizes deployment flexibility and matches the "Breadth of Rectangles" philosophy by keeping the core platform simple.

### 2. Functional Geometry Engine
All calculations in `packages/geometry` will be implemented as pure functions that return new immutable objects.
This ensures testability and avoids side effects when complex modeling scenarios are introduced later.

### 3. SVG for 2D Visualization
SVG will be used for the 2D visualization pane.
It provides better accessibility and DOM integration than Canvas for the current requirement of rendering simple rectangles and text labels.

## Adversarial Audit

### 1. Unit Mismatch Failures
- **Risk:** Calculating areas with mixed `mm` and `inch` primitives.
- **Mitigation:** Functional utilities must validate units and perform explicit conversions using a centralized conversion factor map.

### 2. Numerical Precision
- **Risk:** Floating point errors in grid alignment calculations.
- **Mitigation:** Use an epsilon value for comparisons and prefer rounding to discrete cell units (42mm) as early as possible in the pipeline.

### 3. Build Artifact Bloat
- **Risk:** Including unnecessary Node.js polyfills in the static build.
- **Mitigation:** Strict `bun build` configuration and monitoring of the `dist` size.

### 4. Sync Conflicts
- **Risk:** Concurrent changes to `packages/geometry` by other agents.
- **Mitigation:** OpenSpec `beads-driven` workflow ensures that this slice's tasks are claimed and coordinated via Beads.

## Risks / Trade-offs

- **Trade-off:** Using SVG instead of Canvas might limit performance if the grid cell count grows to thousands (e.g., massive warehouse floors). We accept this for the current scope of personal 3D printing.
- **Risk:** Bun's build system for CSS/HTML is still evolving. We may need to layer in PostCSS or specialized Tailwind plugins if complex styling is required.
