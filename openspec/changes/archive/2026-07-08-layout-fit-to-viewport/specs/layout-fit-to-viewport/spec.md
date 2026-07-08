# layout-fit-to-viewport Specification (delta)

## ADDED Requirements

### Requirement: Pure Viewport Fit Computation

The web application SHALL provide a pure function `computeViewportFit(boundingBox, viewport, marginPx)` that returns a uniform scale and a top-left offset fitting the bounding box inside the viewport with the given margin: `scale = min((viewport.w − 2·marginPx) / bbox.w, (viewport.l − 2·marginPx) / bbox.l)` over axes with positive extent, and offsets centering the scaled content on the unconstrained axis.
The function MUST NOT depend on canvas, DOM, React, or theme state, MUST NOT mutate its inputs, and MUST return finite values for every input: zero extent on one axis uses the other axis's scale, zero extent on both axes yields scale 1 with the content point centered, and available viewport extent clamps to a minimum of 1 px per axis.

#### Scenario: Oversized bounding box scales down to fit

- **WHEN** `computeViewportFit` is given a bounding box larger than the viewport minus margins on at least one axis
- **THEN** the returned scale is less than 1 viewport px per unit of the previous fixed density where applicable, the scaled bounding box fits entirely within the viewport inset by the margin, and the constrained axis touches the margin exactly.

#### Scenario: Tiny bounding box scales up and centers

- **WHEN** `computeViewportFit` is given a bounding box much smaller than the viewport minus margins
- **THEN** the returned scale is greater than the previous fixed density, the constrained axis fills the viewport minus margins exactly, and the free axis's offset centers the content.

#### Scenario: Degenerate bounding boxes return finite results

- **WHEN** `computeViewportFit` is given a bounding box with zero extent on one or both axes
- **THEN** the result contains no `NaN` or `Infinity`: a single zero axis takes its scale from the positive axis, and a fully zero-extent box yields scale 1 centered in the viewport.

### Requirement: Both Render Modes Fit The Full Layout

The layout canvas SHALL render the full extent of the scene inside the canvas in both the top-down 2D mode and the wireframe mode, using `computeViewportFit` with a shared margin constant in place of any fixed pixels-per-inch scale factor.
The 2D mode's bounding box SHALL be the union of the space template's `w`×`l` footprint (when both are defined) and every resolvable placed bin's footprint extent; the wireframe mode SHALL use the existing `WireframeScene.boundingBox`.
Scaling SHALL be uniform on both axes so aspect ratio, right angles, and the cabinet projection's receding angle are preserved.

#### Scenario: Space larger than the legacy canvas capacity is fully visible

- **WHEN** a resolved layout's bounding box exceeds the canvas dimensions at the legacy 24 px/inch density
- **THEN** every placed bin and the space outline map to canvas coordinates within the canvas bounds inset by the margin, in both render modes (verified by fit-math unit tests on the computed coordinates, not pixel inspection).

#### Scenario: Bin outside template bounds expands the 2D bounding box

- **WHEN** a placed bin's footprint extends beyond the template's `w`×`l` rectangle
- **THEN** the 2D bounding box is the union including that bin, so the overflowing bin remains visible rather than scaled or clipped off-canvas.

#### Scenario: Footprint-only template still fits its bins

- **WHEN** the template's `w` or `l` is undefined and at least one placed bin resolves
- **THEN** the 2D bounding box derives from the bin footprints alone and the bins render fitted; unresolvable bin IDs contribute nothing, mirroring the existing draw paths.
