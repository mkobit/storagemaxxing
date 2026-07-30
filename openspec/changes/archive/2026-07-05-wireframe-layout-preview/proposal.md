## Why

Bead sm-9bdk asks for a "3D wireframe layout preview", but the bead is under-scoped: no OpenSpec change, and an acceptance criterion ("renders a perspective view showing bin depths") too vague to implement or verify.
This proposal is the scoping pass that turns it into something implementable — or rejects it — against AGENTS.md's "Breadth of Rectangles" bias, which explicitly classes 3D visualization as a layered feature, not a core requirement.

The exploration found a concrete user problem hiding behind the "3D" framing: bin height is currently invisible everywhere.
The 2D canvas renders only footprints (`w`/`l`), and `packSpace()` never compares bin height against `SpaceTemplate.h` — a 7-unit Gridfinity bin in a 2-inch drawer packs as `valid`.
A user planning a real drawer cannot see which bins are tall, which are short, or which will physically not close the drawer.

The exploration also found the cost is much lower than "3D" suggests.
`PlacedBin.origin` is already a `Point3D`, `BinSpec.nominal` is already `Dimensions3D` with a real `h`, and `SpaceTemplate` carries an optional `h` — no domain model changes are needed at all.
What was evaluated and rejected:

- **Full WebGL / three.js scene with orbit controls**: a heavyweight dependency and a second rendering stack for a static drawer view; fails the breadth-over-depth bias outright.
- **CSS 3D transforms**: requires re-expressing every placement as positioned DOM nodes, creating a second render path that diverges from the existing canvas pipeline (theme tokens, testids, redraw-on-theme-toggle) and scales poorly with bin count.
- **Deferring entirely**: defensible, but leaves the height-invisibility problem unsolved, and the scoped alternative below is small enough (one pure projection module plus one canvas draw routine) that deferral saves little.

What clears the bar: a **2.5D oblique wireframe** (cabinet projection) drawn on the _existing_ 2D canvas.
Zero new dependencies, one new pure-function module in `packages/geometry`, one new draw routine and a toggle in `apps/web`.
It is not "3D" in the camera/orbit sense — it is a fixed-angle parallel projection, which is exactly what a drawer viewed from the front-top needs and nothing more.
A side effect of drawing heights honestly: a bin taller than the space visibly pokes above the space outline, surfacing the height-overflow problem for free (packer-level height _validation_ is out of scope here and filed as a discovered bead).

## What Changes

- Add a pure oblique-projection module to `packages/geometry`: project a `Point3D` to a `Point2D` under a cabinet projection (fixed receding-axis angle, 0.5 depth foreshortening).
- Add a pure scene-builder helper in `apps/web` that converts a `PackingResult` + `SpaceTemplate` + constraints into an ordered list of 2D wireframe polygons (space box edges, per-bin box faces with the constraint color on the top face), sorted back-to-front for painter's-algorithm correctness.
- Add a "Wireframe preview" toggle to the layout view; when on, the existing canvas repaints using the wireframe scene instead of the flat top-down draw; when off, rendering is byte-for-byte the current 2D behavior.
- The toggle state is web-local UI state; it is not persisted and not added to the store's sketch serialization.
- No camera controls, no rotation, no lighting, no changes to packing (`packingModel` stays `"2d"`), no Layer 2 work.

## Capabilities

### New Capabilities

- `wireframe-layout-preview`: an on-demand oblique wireframe rendering of the packed layout that visualizes bin heights against the space's height on the existing canvas.

### Modified Capabilities

(none — `storage-layout`'s Rendered Layout requirement is unchanged; the 2D top-down view remains the default and its scenarios still hold verbatim when the toggle is off)

## Impact

- Affected packages in the DAG: `packages/geometry` (additive pure functions only) and `apps/web`.
- Explicitly unaffected: `packages/catalog`, `packages/assembly`, `packages/packer`, `packages/store` — no type changes, no new fields, no serialization changes.
- No new runtime dependencies.
- New unit tests in `packages/geometry` (exact projected coordinates) and `apps/web` (scene-builder output), plus one Playwright e2e for the toggle flow.
- Discovered, out of scope, filed as its own bead: `packSpace()` does not validate bin height against `SpaceTemplate.h`, so too-tall bins pack as `valid`.

## Success Criteria

- With the toggle off, the layout view renders exactly as today and all existing `storage-layout` e2e scenarios pass unchanged.
- With the toggle on, the canvas renders the space as an oblique wireframe box and each placed bin as an oblique box at its packed `origin` with its catalog `nominal` dimensions, top face filled with the constraint color used in the 2D view.
- A bin whose height exceeds `SpaceTemplate.h` visibly extends above the space's top edge in the wireframe view (verified by a scene-builder unit test asserting projected geometry, not by pixel inspection).
- Projection helpers in `packages/geometry` are pure, covered by unit tests with exact expected coordinates, and pass the `functional/*` lint rules.
- `bun run lint`, `bun run typecheck`, and `bun test` pass; the new e2e passes with `bun run --cwd apps/web test:e2e`.
