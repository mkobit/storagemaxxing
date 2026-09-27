## Why

The current web interface for `apps/web` is an uncomposed engineering prototype despite having design tokens and dark/light theming.
The primary toolbar mixes editing modes, data import/export, four developer fixture buttons, an inline five-input space creation form, and space switching buttons into a single horizontal strip.
This layout results in truncated input fields, clipped dropdown options, and severe horizontal crowding.
Additionally, the 2D canvas presentation lacks viewport controls, clear framing, and intuitive status indicators.
To transition `apps/web` into a polished spatial planning application, the interface must converge toward a structured application shell with clear visual hierarchy, decoupled developer tools, and an accessible space management workflow.

## What Changes

- Introduce a top-level `AppHeader` component that cleanly presents the application title, the active space selector, global actions (export/import), and the theme toggle.
- Extract developer test fixtures (`Add starter bins` variants from `GoldenPathSetup.tsx`) out of the default toolbar into a dedicated, collapsible Developer Tools menu or drawer.
- Redesign the space creation form from a horizontal inline strip into a dedicated modal or drawer dialog (`CreateSpaceDialog`), providing spacious, well-labeled inputs and accessible validation feedback.
- Refactor `SpaceSwitcher` into an accessible dropdown or popover selector within the header that displays the current space name and lets users switch or trigger the creation dialog.
- Enhance `LayoutCanvas` container chrome with dedicated viewport controls (fit to viewport, zoom reset, pan mode toggle) and clean validation indicators.
- Support the component refinement loop using Storybook stories (`apps/web/src/ui/**/*.stories.tsx`) and Playwright screenshot recipes (`apps/web/scripts/screenshot-recipes.ts`) for visual verification.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `web-design-system`: Add requirements for application shell composition, navigation hierarchy, and Storybook/screenshot component verification.
- `drawer-space-manager`: Update requirements for space creation and switching to use dedicated dialogs and selector menus instead of persistent inline toolbar forms.

## Impact

- **Affected packages**: `apps/web` exclusively.
- `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer`, and `packages/store` are unaffected.
- **Affected data**: No schema changes to domain objects or store states; UI state manages dialog visibility and toolbar modes.
- **Specs**: Delta specifications under `openspec/changes/ux-convergence/specs/web-design-system/spec.md` and `openspec/changes/ux-convergence/specs/drawer-space-manager/spec.md`.

## Success Criteria

- The persistent application toolbar no longer renders raw developer fixture buttons by default.
- Developer fixture actions remain accessible for testing and manual exploration through a dedicated developer menu.
- Space creation is invoked via a dialog or drawer that prevents horizontal toolbar layout clipping.
- Existing E2E test flows for golden path, space creation, and space switching pass without regression.
- Every updated UI component has a corresponding Storybook story file covering default, active, and empty states.
- Monorepo quality gates (`bun run typecheck`, `bun run lint`, `bun test`, `bun run openspec:validate`) pass cleanly.
