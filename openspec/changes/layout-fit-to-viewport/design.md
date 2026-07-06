## Context

`apps/web/src/ui/LayoutCanvas.tsx` paints both render modes onto a single `<canvas width={800} height={600}>` using a module constant `PIXELS_PER_INCH = 24`.
The 2D path draws `template.w * 24`, `template.l * 24`, and each placed bin's `origin`/`nominal` times 24, with no bounding-box concept.
The wireframe path already has a bounding box — `buildWireframeScene` returns `WireframeScene.boundingBox: Rect2D` in raw projected inch units (y-up) via `computeBoundingBox` — but `paintWireframe` uses it only to translate the scene to `WIREFRAME_MARGIN_PX = 20` from the edges, per the archived wireframe change's D5: "no scaling, so a scene taller or wider than the canvas simply clips at the edges, same limitation as the 2D view."
That change's Risks section deferred the fix as "a shared fit-to-viewport pass for both views is a natural follow-up bead" — this design is that follow-up.

The relevant existing types: `Rect2D` (`packages/geometry/src/Rect2D.ts`) is `{ origin: Point2D, dimensions: Dimensions2D }` with an existing Zod schema; `PlacedBin.origin` is a `Point3D` `[x, 0, z]`; `BinSpec.nominal` is `Dimensions3D`.

## Goals / Non-Goals

**Goals:**

- One pure, shared fit computation — bounding box + viewport + margin in, scale + offset out — with no canvas, DOM, or React dependency, asserted by exact-value unit tests.
- Both render paths use it: the whole layout is visible for any space size, in both modes, with aspect ratio preserved.
- Defined, tested behavior for oversized, tiny, exact-fit, and degenerate (zero-extent, empty) bounding boxes.
- Keep the diff mechanical at the call sites: draw functions swap `PIXELS_PER_INCH` for a passed-in fit; no restructuring of the paint effect.

**Non-Goals:**

- No pan/zoom, no user-controlled scale, no scale indicator or ruler UI.
- No change to the canvas element's 800×600 dimensions, device-pixel-ratio handling, or responsive sizing — the fit targets the existing fixed viewport.
- No changes to `buildWireframeScene`, the cabinet projection, painter ordering, or anything else the wireframe change already decided.
- No re-litigation of `packages/geometry` contents: the fit math stays in `apps/web` (see D2).

## Data Flow

```
packages/geometry            apps/web/src/ui
-----------------            ---------------
Rect2D  ─────────────┐       LayoutCanvas.tsx paint effect
                     │         │
                     │         ├─ 2D mode ──► computeLayoutBounds(template, placedBins, lookupBin)   (pure, NEW)
                     │         │                : Rect2D  (union of template w×l and bin footprints)
                     │         │                        │
                     │         └─ wireframe ──► scene.boundingBox : Rect2D  (existing, unchanged)
                     │                                  │
                     └────────────────► computeViewportFit(boundingBox, viewport, marginPx)          (pure, NEW)
                                          : ViewportFit { scale, offsetX, offsetY }
                                                        │
                              ┌─────────────────────────┴──────────────────────────┐
                              ▼                                                    ▼
                    drawSpaceBounds / drawPackedLayout                    paintWireframe
                    canvasX = (x - bbox.minX)·scale + offsetX             canvasX = (px - bbox.minX)·scale + offsetX
                    canvasY = (z - bbox.minY)·scale + offsetY  (y-down)   canvasY = offsetY + bboxH·scale - (py - bbox.minY)·scale  (y-up flip)
```

`computeViewportFit` and `computeLayoutBounds` live in a new module `apps/web/src/ui/viewportFit.ts`; the module constant `PIXELS_PER_INCH` and `WIREFRAME_MARGIN_PX` in `LayoutCanvas.tsx` are replaced by the fit result and a shared `VIEWPORT_MARGIN_PX`.

## Decisions

**D1 — Bidirectional uniform scale: fit down and up, no cap.**

```ts
scale = min((viewport.width - 2·marginPx) / bbox.dimensions.w,
            (viewport.height - 2·marginPx) / bbox.dimensions.l)
```

Oversized scenes scale down — that is the clipping bug.
Tiny scenes scale up — the whitespace waste is the other half of the stated problem, and the bead's acceptance criterion demands defined, tested behavior for "oversized and tiny spaces".
No upscale cap (e.g. clamping at the old 24 px/inch): a cap would reintroduce arbitrary whitespace for small spaces, and 24 was never a user-facing contract — no spec scenario references pixel density, only relative placement.
Uniform magnification cannot mislead: proportions stay honest at any scale; only absolute px-per-inch changes, which nothing depends on.

**D2 — The fit module lives in `apps/web/src/ui/viewportFit.ts`, not `packages/geometry`.**
The math is generic rect-fitting and *could* live in `geometry`, but nothing below `web` in the DAG needs it, this bead is scoped `apps/web`, and the wireframe change set the precedent that view-layer composition stays in `apps/web` while `geometry` gains only primitives with multiple prospective consumers.
`apps/web` importing `Rect2D` from `geometry` is a legal downward edge.
If a second consumer ever appears (e.g. an export-to-image feature), promotion to `geometry` is a mechanical move because the module is already pure and DOM-free.

**D3 — Uniform scale, aspect ratio preserved, content centered (letterboxed).**
Per-axis stretch would fill the canvas but distort geometry: squares become rectangles in the 2D view, and in the wireframe view the cabinet projection's π/6 receding angle and the "width and height project true to scale" spec scenario would be visually corrupted (right angles shear).
Both paths already apply `PIXELS_PER_INCH` uniformly to both axes today; this design keeps that invariant and centers the fitted content in the leftover axis:

```ts
export type ViewportFit = {
  readonly scale: number;   // px per scene unit (inches for 2D, projected inches for wireframe)
  readonly offsetX: number; // px, canvas x of the fitted content's left edge
  readonly offsetY: number; // px, canvas y of the fitted content's top edge
};

export const computeViewportFit = (
  boundingBox: Rect2D,
  viewport: Dimensions2D,
  marginPx: number,
): ViewportFit
```

Offsets are computed as `offsetX = (viewport.w - bbox.w·scale) / 2` (likewise for y), so the constrained axis lands exactly at the margin and the free axis is centered.

**D4 — One shared function; each path derives its own bounding box.**
`computeViewportFit` is axis-orientation-agnostic: it returns the scale and the top-left corner of the fitted content rect in canvas px, and each painter owns its coordinate mapping.
The 2D path is y-down (plan z maps directly to canvas y); the wireframe path is y-up and keeps its existing flip, now expressed against the fit (`offsetY + bboxH·scale - ...`) instead of the hand-rolled `yBase` translation.
Pushing the y-flip into the shared function (e.g. a `flipY` flag) was rejected: it doubles the function's behavior space and test matrix to save two lines at one call site.

The 2D path gains its missing bounding box via a second pure export:

```ts
export const computeLayoutBounds = (
  template: SpaceTemplate | null,
  placedBins: readonly PlacedBin[],
  lookupBin: (id: string) => BinSpec | undefined,
): Rect2D
```

It unions the template footprint rect (`(0,0)`–`(w,l)` when both are defined) with every resolvable placed bin's footprint rect (`(origin[0], origin[2])`–`+(nominal.w, nominal.l)`).
Union of both — not template alone, not bins alone — because: template `w`/`l` can be undefined (footprint-only templates, where `drawSpaceBounds` already early-returns but bins still draw), an empty space should still show its outline at a sensible scale, and a bin placed or extending outside the nominal template bounds (a future overflow or invalid-pack rendering) must never be scaled off-canvas — the view's job is to show everything, especially the wrong things.
Unresolvable bin IDs are skipped, mirroring `drawPackedLayout` and `buildWireframeScene`.

**D5 — Margin is a parameter; call sites share one constant.**
`marginPx` is a parameter of `computeViewportFit` because the function must be pure and exhaustively testable without reaching for module state, and because a hard-coded margin inside the function would make the degenerate-input contract (D6) untestable at other margins.
Both call sites pass a single shared `VIEWPORT_MARGIN_PX = 20` in `LayoutCanvas.tsx`, replacing `WIREFRAME_MARGIN_PX` — same visual margin the wireframe already has, now applied to both modes.
No per-mode margin difference is introduced; if one is ever wanted it is a one-line call-site change, not a function change.

**D6 — Degenerate inputs have defined, non-throwing behavior.**
- Bounding box with zero extent on one axis (a single line, e.g. a wireframe of a flat scene): scale is computed from the positive axis only.
- Bounding box with zero extent on both axes (empty scene: no template dimensions, no resolvable bins — `computeBoundingBox` already returns a 0×0 rect at the origin): `scale = 1` and the content point centers in the viewport; nothing paints anyway, so any finite scale is acceptable, and 1 is the least surprising.
- Viewport smaller than `2·marginPx` (cannot happen with 800×600 and margin 20, but the function must not divide into a negative): available extent clamps to a minimum of 1 px per axis.
These are exact-value unit test cases, not runtime guards sprinkled at call sites.

**D7 — No new Zod schemas.**
`ViewportFit` is a derived, in-process computation result produced and consumed within a single synchronous paint pass — it is never parsed from external input, persisted, or serialized, so it does not cross a trust boundary.
This follows the explicit precedent of `PackingResult`, `ConstraintFailure`, and `LayoutResolution` (storage-layout-observable-failures D1) and of `ObliqueProjection`/`WireframePolygon` (wireframe-layout-preview D6): plain readonly TS types for derived values, Zod reserved for domain objects entering the system.
The bounding boxes flowing in are existing `Rect2D` values, which already have `Rect2DSchema` for the boundaries that need it.

## Risks / Trade-offs

- **Scale now varies with content, so line widths and dash patterns are no longer tied to a known px-per-inch.**
  Stroke widths stay in px (`lineWidth = 1`), so lines remain crisp at any scale; only fill extents scale.
  Accepted: this is the standard fit-to-view convention.
- **A tiny space magnified to fill 800×600 can look cartoonishly large.**
  Accepted per D1: it is honest, proportional, and strictly better than a postage stamp; an upscale cap can be added later as a one-line clamp in `computeViewportFit` with a test, without signature changes.
- **Re-fitting on every content change means the scale visibly jumps when bins are added or the template changes.**
  Accepted for v1: the paint effect already fully repaints on those changes; animated scale transitions are a polish follow-up, not a correctness concern.
- **E2E screenshots change.**
  Existing e2e asserts testids, visibility, and badge text — not pixels — so no assertions should break; the visual baseline captured via `bun run screenshot` will differ and reviewers should expect that.
- **Two bounding-box derivations (2D footprint union vs. wireframe projected polygons) could drift.**
  Accepted: they measure genuinely different geometry (plan extents vs. projected extents) and share the single fit function, which is where the correctness lives.

## Adversarial Audit

- **Template with undefined `w`/`l` (footprint-only) and placed bins:** `computeLayoutBounds` skips the template rect and unions bin footprints only; bins render fitted instead of anchored to a nonexistent outline. Unit test pins this.
- **No template and no resolvable bins:** 0×0 bounding box hits D6's `scale = 1` branch; canvas stays blank without NaN/Infinity entering `ctx` calls (division by zero is the failure mode this guards).
- **Bin at a negative origin or outside template bounds:** the union bounding box expands to include it, so overflow evidence is visible, never scaled off-canvas; the space outline shifts by the fit offset accordingly.
- **`Rect2D.origin` non-zero in the wireframe path:** already the case today (projected minima can be negative); the fit math subtracts `bbox.origin` explicitly, and reusing the existing `computeBoundingBox` output means no new origin assumptions.
- **Aspect-ratio extremes (e.g. 200"×2" shelf):** the constrained axis fits to margin, the free axis centers; the 2-inch dimension renders thin but proportionally correct. A per-axis stretch would have hidden this honesty problem — D3 rejects it.
- **Theme toggle while fitted:** unchanged mechanism — fit math is color-independent, and the paint effect's `resolvedTheme` dependency repaints with the same fit.
- **Float drift at exact-fit boundaries:** scale is a single division and offsets a single multiply-subtract; tests assert exact values for integer-friendly fixtures and tolerance comparisons where π-derived wireframe coordinates are involved.
- **Concurrent edits to `LayoutCanvas.tsx`:** the change replaces the scale constant inside existing draw functions and deletes `WIREFRAME_MARGIN_PX`; it does not move functions or touch the toggle/badge JSX, keeping merge surface with other web beads small.
- **Lint topology and purity:** `viewportFit.ts` imports only `geometry`/`assembly`/`catalog` types (legal downward edges from `web`) and must satisfy `functional/*` rules — no `let`, no mutation; the `Math.min`/spread pattern used by `computeBoundingBox` is the template.
- **Sync conflict with the archived wireframe change:** none — this change supersedes only D5's translate-only painter behavior, which was explicitly flagged there as a follow-up; projection math, scene building, and painter ordering are untouched.
