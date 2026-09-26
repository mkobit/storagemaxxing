## 1. OpenSpec & Assembly Schema

- [x] 1.1 Validate OpenSpec change proposal, design, delta spec, and tasks
  - Validation: `bun run openspec:validate`
- [x] 1.2 Add `backClearance` to `SpaceTemplateSchema` and update `createSpaceTemplate` in `packages/assembly/src/SpaceTemplate.ts`
  - Validation: `bun test packages/assembly`
- [x] 1.3 Add unit tests for `backClearance` validation in `packages/assembly/src/SpaceTemplate.test.ts`
  - Validation: `bun test packages/assembly/src/SpaceTemplate.test.ts`

## 2. Web UI Reach Clearance Display

- [x] 2.1 Add `--color-canvas-reach-clearance` CSS token to `apps/web/src/index.css`
  - Validation: `bun run typecheck`
- [x] 2.2 Update `drawSpaceBounds` in `apps/web/src/ui/LayoutCanvas.tsx` to render reach clearance zone, line, and label
  - Validation: `bun run typecheck`
- [x] 2.3 Add unit and component tests in `apps/web/src/ui/LayoutCanvas.test.tsx`
  - Validation: `bun run --filter @storagemaxxing/web test`

## 3. Quality Gates Verification

- [x] 3.1 Run all monorepo quality gates (typecheck, lint, test, openspec validate)
  - Validation: `bun run typecheck && bun run lint && bun run test && bun run openspec:validate`
