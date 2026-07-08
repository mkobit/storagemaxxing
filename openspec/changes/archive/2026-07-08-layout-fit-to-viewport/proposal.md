## Why

Bead sm-xlho tracks a limitation deliberately deferred by the archived `wireframe-layout-preview` change (design.md D5 and its Risks entry "Fixed canvas size clips very large scenes").
Both render paths in `apps/web/src/ui/LayoutCanvas.tsx` draw onto a fixed 800×600 canvas at a hard-coded `PIXELS_PER_INCH = 24` with no scale-to-fit math.
The 2D top-down path (`drawSpaceBounds`, `drawPackedLayout`) multiplies template and bin dimensions by 24 directly, with no bounding-box computation and no clipping guard.
The wireframe path (`paintWireframe`) computes a `WireframeScene.boundingBox` but uses it only to translate the scene to a fixed margin — it never scales.
The consequence is symmetric and user-visible: a space larger than roughly 33"×25" silently clips at the canvas edges in both modes, and a tiny space renders as a postage stamp surrounded by wasted canvas.
A user planning a garage wall or a full closet cannot see their layout at all; a user planning a small drawer squints at a corner.

Alternatives evaluated and rejected:

- **Pan/zoom controls**: solves clipping interactively but adds event handling, gesture state, and persistence questions — far more machinery than the information need ("show me the whole layout") requires, and it would still leave the tiny-space whitespace problem at default zoom.
- **Resizing the canvas element to the scene**: breaks the stable viewport the badges and e2e assertions anchor to, and an arbitrarily large canvas just moves the problem to the page scrollbar.
- **Fixing only the wireframe path**: the 2D path is the default view and clips identically; fixing one mode and not the other would make the toggle change what is visible, which is worse than the current consistent limitation.

What clears the bar: one shared, pure fit-to-viewport computation — bounding box in, scale plus offset out — called by both render paths, replacing the fixed `PIXELS_PER_INCH` scale factor in each.
It is a small, unit-testable pure function plus mechanical call-site changes, entirely within `apps/web`.

## What Changes

- Add a pure fit module `apps/web/src/ui/viewportFit.ts`: given a scene bounding box (`Rect2D`, inches), viewport dimensions (px), and a margin (px), compute a uniform scale and a centering offset that fit the box inside the viewport.
- Add a pure 2D bounding-box helper in the same module that derives a `Rect2D` from the union of the space template's `w`/`l` footprint and every resolvable placed bin's footprint extent — the bounding-box concept the 2D path lacks today.
- Rewire `drawSpaceBounds` and `drawPackedLayout` to take the computed fit and draw at `fit.scale` with the fit offset, instead of the module constant `PIXELS_PER_INCH`.
- Rewire `paintWireframe` to use the same fit function against the existing `WireframeScene.boundingBox`, replacing its translate-only offset math and its private `WIREFRAME_MARGIN_PX`.
- Scale is uniform on both axes (aspect ratio preserved, content centered) and applies in both directions: oversized scenes scale down to fit, tiny scenes scale up to use the canvas.
- No change to `buildWireframeScene`, the cabinet projection math, painter ordering, the toggle, badges, or the canvas element's 800×600 dimensions.

## Capabilities

### New Capabilities

- `layout-fit-to-viewport`: the layout canvas always shows the full extent of the space and its placed bins in both render modes, via a pure, unit-tested fit computation with defined behavior for oversized, tiny, and degenerate bounding boxes.

### Modified Capabilities

(none — `storage-layout`'s Rendered Layout scenarios say placements render "positioned according to the `PackingResult`" without pinning a pixel scale, and `wireframe-layout-preview`'s scenarios assert projection math and toggle behavior, not canvas placement; all existing scenarios hold verbatim under a fitted scale)

## Impact

- Affected packages in the DAG: `apps/web` only.
- Explicitly unaffected: `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer`, `packages/store` — no new primitives, no type changes, no serialization changes; the fit math consumes the existing `Rect2D` type via a legal downward import.
- Files touched: `apps/web/src/ui/LayoutCanvas.tsx` (call sites), new `apps/web/src/ui/viewportFit.ts` and its unit test; `apps/web/src/ui/wireframeScene.ts` is read but not modified.
- No new runtime dependencies.
- Resolves the risk recorded in `openspec/changes/archive/2026-07-05-wireframe-layout-preview/design.md` ("Fixed canvas size clips very large scenes"); supersedes the D5 translate-only comment in `paintWireframe`.

## Success Criteria

- A pure fit-math unit test under `bun test apps/web` covers oversized spaces (scale < 24 px/inch, content fully inside the canvas minus margin), tiny spaces (scale > 24 px/inch, content fills the available area along the constrained axis), exact-fit, and degenerate (zero-extent, empty-scene) bounding boxes, with exact expected scale/offset values.
- A space larger than 33"×25" renders fully visible — no geometry outside the canvas bounds — in both the 2D and wireframe modes.
- The fitted content preserves aspect ratio: a square template renders as a square in the 2D view, and wireframe right angles and the cabinet-projection angle are unchanged.
- `viewportFit.ts` has no canvas, DOM, or React imports.
- All existing `storage-layout` and `wireframe-layout-preview` scenarios pass unchanged; `bun run lint`, `bun run typecheck`, `bun test`, and `bun run --cwd apps/web test:e2e` pass.
