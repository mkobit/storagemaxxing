<!--
  Generated snapshot of the Beads database. Do not hand-edit checkboxes here —
  edit issue state via `bd update`/`bd close` and regenerate this file.
  Source: bd query 'label=meta:openspec:layout-fit-to-viewport'
-->

## 1. Fit math module

- [ ] 1.1 sm-xlho.1 — Create viewportFit.ts with ViewportFit type and computeViewportFit
- [ ] 1.2 sm-xlho.2 — Add computeLayoutBounds to viewportFit.ts (depends on sm-xlho.1)

## 2. Canvas integration

- [ ] 2.1 sm-xlho.3 — Rewire the 2D render path in LayoutCanvas.tsx to use the viewport fit (depends on sm-xlho.2)
- [ ] 2.2 sm-xlho.4 — Rewire paintWireframe to use the shared viewport fit (depends on sm-xlho.1)

## 3. Verification

- [ ] 3.1 sm-xlho.5 — Run full quality gate for layout-fit-to-viewport (depends on sm-xlho.3, sm-xlho.4)
