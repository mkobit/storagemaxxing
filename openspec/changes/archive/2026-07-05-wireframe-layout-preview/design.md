## Context

The layout view (`apps/web/src/ui/LayoutCanvas.tsx`) draws a top-down 2D projection of `PackingResult.placedBins` on a `<canvas>` at `PIXELS_PER_INCH = 24`, using theme tokens resolved at paint time and repainting on theme toggle.
The domain model already carries everything a height-aware view needs: `PlacedBin.origin` is a `Point3D` (`[x, 0, z]` with y as the vertical axis, per `packer.ts`'s `createPoint3D(r.x, 0, r.y)`), `BinSpec.nominal` is a `Dimensions3D` with a real `h`, and `SpaceTemplate` has an optional `h`.
Nothing renders or validates that height today.

This design adds an opt-in oblique wireframe rendering on the same canvas, with all geometry math pure and unit-testable, per the decision recorded in `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Visualize bin heights relative to each other and to the space's height, on demand, on the existing canvas.
- Keep all projection and scene-construction logic pure so correctness is asserted by exact-coordinate unit tests, not screenshots.
- Leave the default 2D rendering path byte-for-byte untouched when the toggle is off.
- Zero new runtime dependencies.

**Non-Goals:**

- No perspective camera, orbit/rotation controls, lighting, or shading — this is a fixed parallel projection.
- No changes to packing: `packingModel` stays `"2d"`, and the packer is not taught to validate height (filed separately as a discovered bead).
- No support for polygonal `footprint`-only templates in the wireframe space outline (bins still render; the space outline is skipped, mirroring `drawSpaceBounds`'s early return for undefined `w`/`l`).
- No persistence of the toggle; it is ephemeral component state, deliberately excluded from sketch serialization.
- No hidden-line removal; overdraw is resolved by painter's-algorithm ordering only.

## Data Flow

```
packages/store                packages/geometry              apps/web
--------------                -----------------              --------
selectPackedLayout ──► PackingResult { placedBins[Point3D] }
                                                              LayoutCanvas.tsx
                                                                │  wireframe toggle (local useState)
                                                                ▼
                       ObliqueProjection.ts          wireframeScene.ts (pure)
                       projectPoint(proj, p3) ◄───── buildWireframeScene(result,
                         : Point2D                     template, constraints, lookupBin)
                                                       : readonly WireframePolygon[]
                                                                │  (ordered back-to-front,
                                                                │   colors as token names)
                                                                ▼
                                                     paintWireframe(ctx, scene)
                                                       resolveCanvasToken() per paint,
                                                       repaint on theme change
```

`geometry` gains only the projection primitive; the scene builder lives in `apps/web` because it consumes `PackingResult`, `SpaceTemplate`, and catalog lookups, which sit above `geometry` in the DAG.

## Decisions

**D1 — Cabinet projection with y-up math in `packages/geometry`.**
New module `packages/geometry/src/ObliqueProjection.ts`:

```ts
export type ObliqueProjection = {
  readonly angleRadians: number; // receding-axis angle
  readonly depthScale: number;   // foreshortening of the receding (z) axis
};

export const CABINET_PROJECTION: ObliqueProjection = {
  angleRadians: Math.PI / 6,
  depthScale: 0.5,
};

// screenX = p[0] + depthScale·cos(angle)·p[2]
// screenY = p[1] + depthScale·sin(angle)·p[2]   (y-up; the web layer flips to canvas coords)
export const projectPoint = (proj: ObliqueProjection, p: Point3D): Point2D
```

Cabinet projection (depth foreshortened to 0.5) is the standard drafting convention for exactly this view and keeps dimensions along x and y (height) true to scale, so a 2-inch-tall bin reads as twice a 1-inch bin.
The module is pure math with no canvas or DOM knowledge; the y-flip and `PIXELS_PER_INCH` scaling stay in `apps/web`.

**D2 — Pure scene builder in `apps/web`, impure painter kept thin.**
`apps/web/src/ui/wireframeScene.ts` exports:

```ts
export type WireframePolygon = {
  readonly points: readonly Point2D[];      // projected, inches, y-up
  readonly fillToken?: string;              // CSS custom property name, resolved at paint time
  readonly fillColor?: string;              // literal color (constraint colors)
  readonly strokeToken: string;
};

export const buildWireframeScene = (
  result: PackingResult,
  template: SpaceTemplate | null,
  constraints: readonly SpaceConstraint[],
  lookupBin: (id: string) => BinSpec | undefined,
): readonly WireframePolygon[]
```

Each placed bin contributes its three visible faces for a front-top-right viewpoint — top, front, right — with the constraint color on the top face (matching the 2D view's color identity) and surface tokens on the other faces, plus stroked edges.
The space contributes its box edges (floor rectangle, verticals, top rectangle) when `w`/`l`/`h` are defined.
Colors are carried as token _names_ (plus literal constraint colors), so the painter resolves them per paint and the existing theme-repaint effect keeps working.

**D3 — Deterministic painter ordering.**
Polygons are sorted back-to-front by bin `origin[2]` descending, then `origin[0]` ascending, then `binId` ascending as a total-order tie-break.
With the receding axis pointing up-right, larger `z` is farther away, so nearer bins paint last and correctly overlap.
The x tie-break must be ascending because the viewer is effectively on the +x side: for two same-depth x-adjacent bins, the right bin's front face physically occludes the left bin's right face, so the right (larger-x) bin paints later.
This lexicographic origin sort is exact for depth-separated bins and same-depth neighbors; rare arrangements of long thin bins with partially overlapping z-ranges can still overdraw imperfectly, which is a cosmetic v1 limitation recorded in Risks rather than solved with a separating-axis topological sort.
The total order makes scene output stable for unit tests and across renders.

**D4 — Toggle is local UI state in `LayoutCanvas.tsx`.**
A button (`data-testid="wireframe-toggle"`, `aria-pressed`) rendered with the canvas flips a `useState<boolean>`.
The paint effect branches on it: off → the existing `drawSpaceBounds` + `drawPackedLayout` path, unchanged; on → `paintWireframe(ctx, buildWireframeScene(...))`.
It is not added to the Zustand store or sketch serialization: it is a view preference of one component, and putting it in the store would drag it into persistence scope for no benefit.

**D5 — Fit-to-canvas via bounding-box translation, not scaling.**
The scene builder returns the projected bounding box alongside the polygons; the painter only translates so the scene fits the existing 800×600 canvas with a margin, keeping `PIXELS_PER_INCH` constant.
If a scene genuinely exceeds the canvas, it clips — acceptable for v1 and consistent with the 2D view, which has the same limitation.

**D6 — No new Zod schemas.**
`ObliqueProjection` and `WireframePolygon` never cross a serialization or trust boundary: they are compile-time types produced and consumed within a single synchronous render pass, never parsed from external input or persisted.
Zod validation is reserved for domain objects entering the system (per existing convention: `PlacedBinSchema`, `SpaceTemplateSchema`); adding schemas here would be dead runtime cost.

## Adversarial Audit

- **`template.h` undefined (w/l-only or footprint templates):** the space outline degrades to the floor rectangle with no verticals; bins still render with height. Scene-builder unit test pins this.
- **Unresolved bin IDs:** `lookupBin` returns `undefined`; the bin is skipped, exactly as `drawPackedLayout` does today, and the existing `layout-unresolved-count` badge still reports it.
- **Zero-height bins or `h: 0` data errors:** top and floor faces coincide; renders as a flat parallelogram rather than crashing. No special casing.
- **Painter-order edge cases:** same-depth x-adjacent bins are handled by D3's ascending-x tie-break (right neighbor paints over the left neighbor's hidden right face); the residual mis-ordering risk is long thin bins with partially overlapping z-ranges, which is cosmetic overdraw only and accepted in Risks. Identical `z` and `x` cannot co-occur in a valid pack (MaxRects doesn't overlap footprints), so the `binId` tie-break is purely for determinism.
- **Theme toggle while wireframe active:** the paint effect already depends on `resolvedTheme`; token resolution at paint time (D2) means the wireframe repaints correctly — same mechanism the 2D path uses since the dark-mode canvas-token change (#189).
- **Concurrent edits to `LayoutCanvas.tsx`:** this change is additive (new branch in the effect, new button); it does not move or rename the existing draw functions, minimizing merge conflict surface with other web beads.
- **E2E flakiness:** the e2e asserts toggle presence, `aria-pressed` flip, and canvas visibility only; all geometry assertions live in `bun test` unit tests with exact coordinates, so no pixel-diffing enters CI.
- **Lint topology:** `apps/web` importing `packages/geometry` is a legal downward edge in the DAG; the new geometry module is pure and satisfies `functional/*` rules (no `let`, no mutation).

## Risks / Trade-offs

- **Oblique ≠ what users may picture as "3D".**
  No rotation, fixed angle.
  Accepted: the bead's actual information need (see heights) is met at a fraction of the cost, and a real 3D scene remains possible later as a further layered feature without discarding this work (the scene builder isolates rendering from data).
- **Overdraw without hidden-line removal can look busy for dense packs.**
  Accepted for v1; face fills (not just lines) mitigate most visual confusion, and painter ordering keeps it coherent.
- **Lexicographic painter ordering is not exact for every arrangement.**
  Long thin bins whose z-ranges partially overlap can overdraw a neighbor's face that should be hidden.
  Accepted for v1 as cosmetic-only; the fix (separating-axis pairwise comparator with topological sort) is a contained follow-up if real layouts ever exhibit it.
- **Fixed canvas size clips very large scenes.**
  Shared with the existing 2D view; a shared fit-to-viewport pass for both views is a natural follow-up bead, not part of this change.
