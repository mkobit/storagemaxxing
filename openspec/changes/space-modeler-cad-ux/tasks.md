<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Specification & Contract Spike

- [x] 1.1 Specify Space Modeler CAD UX, HUD controls, state transitions, and SpaceTemplate contract ([sm-54wg.3](../../../.beads))
  - Validation: `bunx openspec validate space-modeler-cad-ux`

## 2. Geometry & Assembly Contracts

- [ ] 2.1 Add polygon footprint and extrusion schemas to `packages/geometry` and `packages/assembly`
  - Validation: `bun test packages/geometry packages/assembly`
- [ ] 2.2 Add unit tests for polygon footprint validation and AABB bounds calculation
  - Validation: `bun test packages/geometry/src/dimensions.test.ts`

## 3. Web UI CAD Modeler

- [ ] 3.1 Implement 2D orthographic drawing canvas and adaptive tape-measure grid in `apps/web`
  - Validation: `bun test apps/web`
- [ ] 3.2 Implement floating dimension HUD with fractional inch and metric keyboard inputs
  - Validation: `bun test apps/web`
- [ ] 3.3 Implement 3D extrusion normal arrow gizmo and live height badge
  - Validation: `bun test apps/web`
- [ ] 3.4 Implement interactive face role selector (access face, gravity face, obstacles)
  - Validation: `bun test apps/web`

## 4. Verification & Quality Gates

- [ ] 4.1 Run full monorepo verification checks in Docker Sandbox (`sbx`)
  - Validation: `sbx env exec .sbx/sbxenv.yaml -- mise run check`
