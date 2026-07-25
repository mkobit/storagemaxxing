<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Dependencies

- [ ] 1.1 [sm-8shp](../../../.beads) Pin `storybook@10.5.2` + `@storybook/react-vite@10.5.2` to `apps/web` devDependencies
  - Validation: `bun install --frozen-lockfile` resolves cleanly; `bun run --filter @storagemaxxing/web build` (main app) still succeeds.

## 2. Storybook config

- [ ] 2.1 [sm-7pvd](../../../.beads) Add `apps/web/.storybook/main.ts` + `preview.tsx`, `storybook`/`build-storybook` scripts
  - Validation: `bun run --filter @storagemaxxing/web build-storybook` succeeds even with zero story files present.

## 3. Lint and typecheck wiring

- [ ] 3.1 [sm-zie9](../../../.beads) Wire `eslint-plugin-storybook` + `apps/web/tsconfig.json` include for Storybook files
  - Validation: `bun run lint && bun run typecheck` pass; a deliberate lint violation in a scratch story file confirms `eslint-plugin-storybook` rules are active (removed before commit).

## 4. Initial story slice

- [ ] 4.1 [sm-ailr](../../../.beads) Add stories: `ThemeToggle`, `StrategyCard`
  - Validation: `bun run --filter @storagemaxxing/web build-storybook` builds both stories, rendering correctly in light and dark mode with no console errors.
- [ ] 4.2 [sm-pmv3](../../../.beads) Add stories: `BOMRow`, `BOMHeader`, `BOMSummary`
  - Validation: `bun run --filter @storagemaxxing/web build-storybook` builds all three, confirming `@storagemaxxing/catalog`/`@storagemaxxing/assembly` imports resolve inside Storybook.
- [ ] 4.3 [sm-ljaw](../../../.beads) Add stories: `ConstraintRow`, `ConstraintInputs`
  - Validation: `bun run --filter @storagemaxxing/web build-storybook` builds both, rendering correctly in light and dark mode with no console errors.

## 5. CI

- [ ] 5.1 [sm-6vrs](../../../.beads) Add `build-storybook` step to `.github/workflows/ci.yml`'s `verify` job
  - Validation: a deliberately broken story fails the `verify` job's Storybook build step; reverting it passes.

## 6. Verification

- [ ] 6.1 [sm-totw](../../../.beads) Full quality-gate verification for `storybook-adoption`
  - Validation: `bun run lint && bun run typecheck && bun test` pass; `bun run --filter @storagemaxxing/web build && ! grep -rqE '\.storybook|\.stories\.' apps/web/dist` (production build excludes Storybook config and story references).
