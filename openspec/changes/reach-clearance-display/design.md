## Context

Users planning storage in drawers often encounter spaces where the rear portion cannot be fully accessed because the drawer does not pull out completely.
For example, a drawer with 20 inches of physical depth might require 4 inches of clearance at the rear, leaving 16 inches of usable depth.
Currently, `SpaceTemplate` in `packages/assembly/src/SpaceTemplate.ts` stores `w`, `l`, and `h` without reach clearance metadata.
In `apps/web/src/ui/LayoutCanvas.tsx`, `drawSpaceBounds` strokes the outer rectangle of the space boundary without differentiating usable depth from clearance zones.
Bead `sm-jyyq` introduces an informational, display-only `backClearance` field to `SpaceTemplate` and surfaces this visually in the 2D top-down view.

## Goals / Non-Goals

**Goals:**

- Extend `SpaceTemplateSchema` with an optional `backClearance: z.number().nonnegative().optional()` field.
- Update `createSpaceTemplate` to accept optional `backClearance` while preserving backwards compatibility for existing calls.
- Render a shaded clearance band, dashed dividing line, and inline text label in `LayoutCanvas.tsx` when `backClearance > 0`.
- Verify behavior with automated unit tests in `packages/assembly` and `apps/web`.

**Non-Goals:**

- Exclusion of clearance zone from the packing engine placement calculations (deferred to epic `sm-t45l`).
- 3D wireframe preview visualization of clearance (explicitly out of scope for MVP).
- UI form controls to create or edit `backClearance` interactively in the space manager form (custom spaces continue defaulting to undefined clearance for now).

## Data Flow Diagram

```
+-------------------------------------------------------------+
|                     SpaceTemplate                           |
|  - id: SpaceTemplateId                                      |
|  - w: number, l: number, h: number                          |
|  - backClearance?: number (optional, non-negative)          |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              Store / layoutSelectors.ts                     |
|  - Passes SpaceTemplate into LayoutResolution unchanged     |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  LayoutCanvas.tsx                           |
|                                                             |
|  drawSpaceBounds(ctx, template, transform)                  |
|                                                             |
|  1. Stroke outer bounds: (0, 0) to (w, l)                   |
|  2. If template.backClearance > 0:                          |
|     - usableDepth = template.l - template.backClearance     |
|     - Fill band: (0, usableDepth) to (w, l)                 |
|     - Dashed line: across w at y = usableDepth              |
|     - Text label: `${backClearance}in reach clearance       |
|                    (usable depth ${usableDepth}in)`         |
+-------------------------------------------------------------+
```

## Decisions

### 1. Optional Schema Property in SpaceTemplateSchema

`backClearance` is modeled as `z.number().nonnegative().optional()` on `SpaceTemplateSchema`.
Because it is optional, all existing templates, serialization schemas, and test fixtures remain valid without modification.

Illustrative schema snippet:

```ts
export const SpaceTemplateSchema = z.object({
  id: SpaceTemplateIdSchema,
  name: z.string(),
  type: SpaceTypeIdSchema,
  accessFace: AccessFaceSchema,
  w: z.number().optional(),
  l: z.number().optional(),
  h: z.number().optional(),
  backClearance: z.number().nonnegative().optional(),
  // ...
});
```

### 2. Backward-Compatible Factory Signature

`createSpaceTemplate` in `packages/assembly/src/SpaceTemplate.ts` currently takes `(id: string, dimensions: Dimensions3D, accessFace: AccessFace)`.
An optional fourth parameter `options?: { readonly backClearance?: number }` is added.
Existing call sites across `packages/packer`, `packages/store`, and `apps/web` pass 3 parameters and remain completely unchanged.

### 3. Canvas Rendering Specification

In `apps/web/src/ui/LayoutCanvas.tsx`, `drawSpaceBounds` handles drawing the space rectangle.
When `template.w` and `template.l` are defined and `template.backClearance` is defined and `> 0`:

- `usableDepth = template.l - template.backClearance`.
- Calculate canvas coordinates:
  - `spaceX = (0 - bounds.origin[0]) * fit.scale + fit.offsetX`
  - `clearanceY = (usableDepth - bounds.origin[1]) * fit.scale + fit.offsetY`
  - `spaceW = template.w * fit.scale`
  - `clearanceH = template.backClearance * fit.scale`
- Fill rectangle from `(spaceX, clearanceY)` with width `spaceW` and height `clearanceH` using theme token `--color-canvas-reach-clearance` (fallback `rgba(100, 116, 139, 0.15)`).
- Stroke dashed line `[4, 2]` from `(spaceX, clearanceY)` to `(spaceX + spaceW, clearanceY)` using stroke token `--color-canvas-grid`.
- Render inline text label: `${template.backClearance.toFixed(1)}in reach clearance (usable depth ${usableDepth.toFixed(1)}in)` positioned at `spaceX + 8`, vertically centered in the clearance band or offset by margin.

### 4. Theme Integration

Add `--color-canvas-reach-clearance` to `apps/web/src/index.css`:

- Light theme (`:root`): `rgba(100, 116, 139, 0.15)`.
- Dark theme (`.dark`): `rgba(148, 163, 184, 0.15)`.

## Package Impacts & Code Verification

Verified by inspecting the actual tree and running test suites:

- `packages/assembly/src/SpaceTemplate.ts`: Exports `SpaceTemplateIdSchema`, `SpaceTemplateSchema`, `SpaceTemplate`, and `createSpaceTemplate`. Verified by checking exports with `rg`.
- `packages/assembly/src/domain.test.ts`: Contains existing template schema tests; runs cleanly with `bun test packages/assembly`.
- `packages/packer/src/packer.ts`: Exports `packSpace`. Packer tests in `packages/packer/src/packer.test.ts` and `packages/packer/test/golden-path.test.ts` call `createSpaceTemplate` with 3 arguments; verified that `bun test packages/packer` passes without modification.
- `apps/web/src/ui/LayoutCanvas.tsx`: Exports `LayoutCanvas`. `drawSpaceBounds` is exported to allow unit testing of rendering coordinates and canvas operations.
- `apps/web/src/index.css`: Contains `--color-canvas-grid`, `--color-canvas-outline`, `--color-canvas-fallback-fill`, and `--color-canvas-wireframe-surface`. Verified with `rg`.
- `apps/web/e2e/space-manager.spec.ts`: Checks canvas aspect ratio for spaces without clearance; verified that omitting `backClearance` retains identical aspect ratio measurements.

## Risks / Trade-offs

- **Clearance exceeds space depth**: If `backClearance > l`, `usableDepth` becomes negative. The schema allows any non-negative `backClearance` without coupling to `l` (which can be undefined if `footprint` is used). In rendering, `drawSpaceBounds` only renders clearance when `w` and `l` are defined, and formats `usableDepth` directly.
- **Canvas context mocking in happy-dom**: `HTMLCanvasElement.prototype.getContext("2d")` returns `null` by default in happy-dom. Unit tests for `drawSpaceBounds` will supply a mock `CanvasRenderingContext2D` to test path, stroke, fill, and text calls directly.
