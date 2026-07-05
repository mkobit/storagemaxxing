<!--
  Generated snapshot of the Beads database. Do not hand-edit checkboxes here —
  edit issue state via `bd update`/`bd close` and regenerate this file.
  Source: bd query 'label=meta:openspec:wireframe-layout-preview'
-->

## 1. Geometry

- [x] 1.1 sm-afiu — Add ObliqueProjection cabinet projection primitive to packages/geometry

## 2. Scene construction

- [x] 2.1 sm-5vz0 — Wireframe scene builder: bin face polygons with constraint colors (depends on sm-afiu)
- [x] 2.2 sm-eo05 — Wireframe scene builder: space outline, painter ordering, degradation cases (depends on sm-5vz0)

## 3. Integration

- [x] 3.1 sm-a7op — Wireframe toggle and canvas painter in LayoutCanvas (depends on sm-eo05)

## 4. Verification

- [x] 4.1 sm-v5cd — E2E coverage: wireframe preview toggle flow (depends on sm-a7op)

<!--
  Discovered during scoping, tracked outside this change:
  sm-csu4 — packSpace does not validate bin height against SpaceTemplate.h (bug, scope:packer, discovered-from:sm-9bdk)
-->
