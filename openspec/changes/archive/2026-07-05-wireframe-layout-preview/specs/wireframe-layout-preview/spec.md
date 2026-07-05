# wireframe-layout-preview Specification (delta)

## ADDED Requirements

### Requirement: Oblique Projection Primitive

`packages/geometry` SHALL export a pure cabinet-projection primitive that maps a `Point3D` to a `Point2D` as `screenX = x + depthScale·cos(angle)·z` and `screenY = y + depthScale·sin(angle)·z` (y-up), parameterized by an `ObliqueProjection` value, with a `CABINET_PROJECTION` constant of angle π/6 and depth scale 0.5.
The function MUST NOT mutate its inputs and MUST NOT depend on canvas, DOM, or theme state.

#### Scenario: Origin projects to origin

- **WHEN** `projectPoint(CABINET_PROJECTION, createPoint3D(0, 0, 0))` is called
- **THEN** the result is the 2D origin `(0, 0)`.

#### Scenario: Depth recedes at the configured angle and scale

- **WHEN** `projectPoint(CABINET_PROJECTION, createPoint3D(0, 0, d))` is called for a depth `d > 0`
- **THEN** the result is `(d·0.5·cos(π/6), d·0.5·sin(π/6))` within floating-point tolerance, and the input point is unmodified.

#### Scenario: Width and height project true to scale

- **WHEN** `projectPoint(CABINET_PROJECTION, createPoint3D(x, y, 0))` is called
- **THEN** the result is exactly `(x, y)` — points in the front plane are not foreshortened.

### Requirement: Wireframe Scene Construction

The web application SHALL provide a pure scene builder that converts a `PackingResult`, an optional `SpaceTemplate`, the space's constraints, and a catalog lookup into an ordered, readonly list of projected 2D polygons: for each resolvable placed bin, the top, front, and right faces of the box at `origin` with the bin's `nominal` dimensions; for the space, its box edges when `w`, `l`, and `h` are defined.
Bin polygons SHALL carry the constraint color for the top face, matching the bin's color identity in the 2D view.
The list SHALL be ordered back-to-front (descending `origin[2]`, then ascending `origin[0]`, then ascending `binId`) so painting in list order yields correct overlap for depth-separated bins and for same-depth x-adjacent bins, where the larger-x bin's front face must paint over its left neighbor's right face.

#### Scenario: Placed bin yields three faces at projected coordinates

- **WHEN** the scene builder is given a result with one placed bin whose spec resolves
- **THEN** the output contains that bin's top, front, and right face polygons whose vertices equal `projectPoint(CABINET_PROJECTION, ·)` of the corresponding box corners, with the constraint color on the top face.

#### Scenario: Painter ordering is deterministic back-to-front

- **WHEN** the scene builder is given two bins at different depths (`origin[2]`)
- **THEN** the deeper bin's polygons precede the nearer bin's polygons in the output, and repeated invocations produce an identical ordering.

#### Scenario: Bin taller than the space extends above the space outline

- **WHEN** a placed bin's `nominal.h` exceeds the template's `h`
- **THEN** the projected y of the bin's front top edge (`nominal.h + depthScale·sin(angle)·origin[2]`) exceeds the projected y of the space's top plane evaluated at the same depth (`template.h + depthScale·sin(angle)·origin[2]`) — i.e. the comparison is made at the bin's own depth, not against the space's far edge.

#### Scenario: Unresolved bins are skipped, not fabricated

- **WHEN** a placed bin's `binId` does not resolve through the catalog lookup
- **THEN** the scene output contains no polygons for that bin and the remaining bins are unaffected.

#### Scenario: Space without full dimensions degrades to floor outline

- **WHEN** the template's `h` is undefined (or the template is null)
- **THEN** the scene contains no vertical or top space edges — at most the floor rectangle when `w` and `l` are defined — and bin polygons are still produced.

### Requirement: Wireframe Preview Toggle

The web application SHALL render a toggle control with `data-testid="wireframe-toggle"` and an `aria-pressed` state alongside the layout canvas whenever a resolved layout is shown.
When toggled on, the canvas SHALL repaint using the wireframe scene; when toggled off, the canvas SHALL render via the existing top-down 2D path with behavior unchanged, including validity and unresolved-count badges in both modes.
The toggle state SHALL NOT be persisted and SHALL NOT enter the store's sketch serialization.

#### Scenario: Toggle flips rendering mode

- **WHEN** a user activates the wireframe toggle on a resolved layout
- **THEN** `aria-pressed` becomes `true`, the canvas remains visible, and the validity badge (`data-testid="layout-validity-badge"`) continues to report the same validity value.

#### Scenario: Default rendering is unchanged

- **WHEN** the toggle has never been activated
- **THEN** the layout view renders via the existing 2D path and all existing `storage-layout` Rendered Layout scenarios hold verbatim.

#### Scenario: Theme change repaints the wireframe

- **WHEN** the wireframe view is active and the user switches theme
- **THEN** the canvas repaints with stroke and fill colors resolved from the current theme's tokens.
