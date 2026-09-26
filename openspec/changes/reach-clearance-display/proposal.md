## Why

When organizing drawers or enclosed spaces, the full physical depth of the space is often not fully accessible due to drawer overhang, slides, or cabinet face frames.
Users need to see how much of a space template's depth is usable after accounting for required reach clearance at the back.
Currently, `SpaceTemplate` in `packages/assembly/src/SpaceTemplate.ts` only captures physical dimensions `w`, `l`, and `h`, leaving no structured field to declare reach clearance.
Furthermore, the 2D layout canvas in `apps/web/src/ui/LayoutCanvas.tsx` only renders outer boundary strokes, providing no visual indication of inaccessible rear clearance zones.
Capturing reach clearance as an optional informational attribute on `SpaceTemplate` allows users to understand usable storage depth visually in the top-down canvas without breaking or altering placement semantics.

## What Changes

- Add an optional `backClearance` non-negative number property to `SpaceTemplateSchema` in `packages/assembly/src/SpaceTemplate.ts`.
- Update `createSpaceTemplate` factory in `packages/assembly/src/SpaceTemplate.ts` to support optional `backClearance` while remaining backward-compatible with all existing callers.
- Add unit tests in `packages/assembly/src/SpaceTemplate.test.ts` verifying schema parsing and validation for `backClearance`.
- Update `drawSpaceBounds` in `apps/web/src/ui/LayoutCanvas.tsx` to render a dashed boundary line across width `w` at depth `l - backClearance`, a lightly shaded band filling `l - backClearance` to `l`, and an informational text label indicating the reach clearance and usable depth.
- Add CSS custom property `--color-canvas-reach-clearance` to light and dark theme definitions in `apps/web/src/index.css`.
- Add unit and component tests in `apps/web/src/ui/LayoutCanvas.test.tsx` verifying that reach clearance renders correctly when defined and is omitted when undefined or zero.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `drawer-space-manager`: Add visual indication and domain schema support for informational reach clearance on space templates.

## Impact

- **Affected packages**: `packages/assembly` (adds optional `backClearance` to `SpaceTemplateSchema` and `createSpaceTemplate`), `apps/web` (renders clearance band, dashed line, and text label in `LayoutCanvas.tsx`, defines canvas theme tokens in `index.css`).
- `packages/geometry`, `packages/catalog`, `packages/packer`, and `packages/store` are unaffected: the packing engine continues using full depth `l` as exclusion logic is deferred to epic sm-t45l, and selectors/serialization pass `SpaceTemplate` objects transparently.
- **Affected data**: `SpaceTemplate` gains an optional `backClearance` number field.
- **Docs**: Delta specification added under `openspec/changes/reach-clearance-display/specs/drawer-space-manager/spec.md`.

## Success Criteria

- `SpaceTemplateSchema` validates valid non-negative `backClearance` values and rejects negative values.
- `createSpaceTemplate` accepts an optional `backClearance` while preserving identical behavior for existing callers.
- When `template.backClearance` is positive and dimensions `w` and `l` are defined, `LayoutCanvas` renders a shaded band, a dashed dividing line, and a descriptive label showing clearance and usable depth.
- When `template.backClearance` is undefined or 0, `LayoutCanvas` renders default space bounds with no clearance zone or label.
- All unit and component tests in `packages/assembly/src/SpaceTemplate.test.ts` and `apps/web/src/ui/LayoutCanvas.test.tsx` pass.
- All quality gates (`bun run typecheck`, `bun run lint`, `bun test`, `bun run openspec:validate`) pass cleanly.
