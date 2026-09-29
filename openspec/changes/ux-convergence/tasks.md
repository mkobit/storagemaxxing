## 1. OpenSpec validation

- [x] 1.1 Validate OpenSpec change specification
  - Validation: `bun exec openspec validate ux-convergence --strict`

## 2. Application shell and developer tools extraction

- [x] 2.1 (sm-xfg1.2) Extract `GoldenPathSetup` buttons into a collapsible Dev Tools menu component
  - Validation: `bun test apps/web/src/ui/GoldenPathSetup.test.tsx`
- [ ] 2.2 (sm-xfg1.3) Create `AppHeader` component with branding, space selector trigger, and global utilities
  - Validation: `bun --cwd apps/web check-stories`
- [ ] 2.3 Refactor `Toolbar.tsx` to separate global app bar actions from canvas viewport controls
  - Validation: `bun test apps/web/src/ui/Toolbar.test.tsx`

## 3. Accessible space management

- [ ] 3.1 (sm-xfg1.4) Implement `CreateSpaceDialog` replacing horizontal inline inputs with an accessible form
  - Validation: `bun test apps/web/src/ui/spaceManager/CreateSpaceFormPanel.test.tsx`
- [ ] 3.2 (sm-xfg1.5) Implement dropdown `SpaceSwitcher` component supporting multi-space lists without horizontal overflow
  - Validation: `bun test apps/web/src/ui/spaceManager/SpaceSwitcher.test.tsx`
- [ ] 3.3 Add Storybook stories covering `CreateSpaceDialog` and dropdown `SpaceSwitcher`
  - Validation: `bun --cwd apps/web check-stories`

## 4. Viewport controls and screenshot verification

- [ ] 4.1 (sm-xfg1.6) Update `LayoutCanvas` container with dedicated viewport controls (fit, zoom, pan toggle)
  - Validation: `bun test apps/web/src/ui/LayoutCanvas.test.tsx`
- [ ] 4.2 Add Playwright screenshot recipes for new header, space dialog, and canvas layout
  - Validation: `bun --cwd apps/web test:e2e`
- [ ] 4.3 Run monorepo verification quality gates
  - Validation: `bun run typecheck && bun run lint && bun test && bun run openspec:validate`
