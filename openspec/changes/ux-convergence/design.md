## Context

The web client in `apps/web` has functional features (MaxRects bin placement, constraint editing, multi-space BOM export, and reach clearance visualization) with design tokens and dark/light theming applied.
However, the interface presentation has not yet converged into a coherent user experience.
As identified in epic `sm-xfg1`, the top toolbar is severely overcrowded with competing concerns: mode selection, import/export, four developer fixture setup buttons (`GoldenPathSetup`), a five-input horizontal space creation form, a variable-length list of space buttons (`SpaceSwitcher`), and the theme toggle.
This creates cramped layouts where form fields truncate and controls overflow on smaller viewports.
The user decision for `sm-xfg1` establishes that UI refinement will proceed using Storybook stories and Playwright screenshot recipes as the primary feedback loop, with Google Stitch used for exploratory reference.
This design establishes the architectural foundation for UX convergence, reorganizing the application shell, isolating developer fixtures, and providing an accessible space management workflow.

## Goals / Non-goals

**Goals:**

- Structure the application chrome into an `AppHeader` (branding, space switcher, global utilities) and a focused canvas toolbar (modes, viewport actions).
- Relocate developer fixture actions (`Add starter bins` variants) into a collapsible Developer Tools menu/drawer so production chrome is clean while keeping CI and manual testing workflows functional.
- Replace the cramped horizontal space creation form with a dedicated, accessible dialog/drawer (`CreateSpaceDialog`), maintaining existing `data-testid` attributes to preserve E2E test compatibility.
- Replace the unconstrained button row in `SpaceSwitcher` with an accessible dropdown/popover menu that scales to any number of spaces.
- Anchor visual design refinement in Storybook stories (`apps/web/src/ui/**/*.stories.tsx`) and screenshot recipes (`apps/web/scripts/screenshot-recipes.ts`).

**Non-goals:**

- Replacing the 2D HTML Canvas renderer with WebGL or 3D rendering (deferred).
- Redesigning the packing algorithm or constraint solver domain logic (unaffected).
- Modifying backend persistence or cloud sync schemas (storage remains local Zustand store).

## Data flow and component architecture

```
+---------------------------------------------------------------------------------+
|                                     App                                         |
|  +---------------------------------------------------------------------------+  |
|  |                                  AppHeader                                |  |
|  |  [Logo / Title]  [SpaceSelector: "My Space" v]  ...  [DevMenu] [Theme]    |  |
|  +---------------------------------------------------------------------------+  |
|  |                                  ViewTabs                                 |  |
|  |  [ Layout ] [ BOM ] [ Options ]                                           |  |
|  +---------------------------------------------------------------------------+  |
|  |                                  MainArea                                 |  |
|  |  +--------------------------+  +---------------------------------------+  |  |
|  |  |  ConstraintEditorPanel   |  |             LayoutCanvas              |  |  |
|  |  |  - Bin catalog cards     |  |  - ViewportToolbar (Select, Pan, Fit) |  |  |
|  |  |  - Accessory cards       |  |  - 2D Canvas viewport                 |  |  |
|  |  +--------------------------+  +---------------------------------------+  |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
|  +----------------------------------+     +----------------------------------+  |
|  |      CreateSpaceDialog (Modal)   |     |       DevToolsDrawer (Menu)      |  |
|  |  - Name, System, W x L x D       |     |  - Starter bins (standard)       |  |
|  |  - Accessible form validation    |     |  - Starter bins (tiny/partial)   |  |
|  +----------------------------------+     +----------------------------------+  |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                       Zustand Store (@storagemaxxing/store)                     |
|  - activeSpaceId, spaces, templates, mode                                       |
|  - addTemplate(), addSpace(), setActiveSpace(), setMode()                       |
+---------------------------------------------------------------------------------+
```

## Decisions

### 1. Application shell composition and header separation

The top bar currently defined in `apps/web/src/ui/Toolbar.tsx` bundles global application metadata with canvas-specific interaction modes and developer seed fixtures.
We separate this into:

- `AppHeader`: Renders at the top of `apps/web/src/ui/App.tsx`.
  Contains application branding, the space selector dropdown, export/import actions, developer tools toggle, and `ThemeToggle`.
- Canvas toolbar: Encapsulates canvas-specific modes (`select`, `pan`, and future zoom/fit actions) adjacent to or floating within the canvas viewport.
- Tab bar: Retains the existing `layout`, `bom`, and `options` views, styled as clean segmented controls with proper active states.

### 2. Relocating developer fixtures to a dedicated dev menu

Currently, `apps/web/src/ui/GoldenPathSetup.tsx` injects four large buttons directly into the primary toolbar.
These buttons are essential for CI E2E tests (`apps/web/e2e/golden-path.spec.ts`) and developer testing, but they clutter the user experience.
Decision:

- Wrap `GoldenPathSetup` inside a collapsible dropdown or popover labeled `Dev Tools` (with `data-testid="dev-tools-menu"`).
- Maintain all existing button labels and `data-testid` values (`system-select`, `add-starter-bins`, `add-tiny-starter-bins`, `add-partial-starter-bins`, `add-unresolved-starter-bins`).
- If an E2E test or script clicks these buttons, the dev menu can be open by default in test environments or easily expanded without disrupting normal user layouts.

### 3. Dedicated space creation dialog and dropdown switcher

Currently, `apps/web/src/ui/spaceManager/CreateSpaceFormPanel.tsx` renders five inline inputs horizontally, and `apps/web/src/ui/spaceManager/SpaceSwitcher.tsx` renders a button for each space.
Decision:

- Refactor `SpaceSwitcher` to display the active space name with a chevron, opening a popover menu showing all available spaces, an indication of the active space, and a prominent `+ New space` action button.
- Clicking `+ New space` opens `CreateSpaceDialog`, rendering a focused form with clear labels, proper column/row/depth inputs, storage system selector, and validation messaging.
- Maintain existing `data-testid` hooks (`create-space-form`, `create-space-name`, `create-space-system`, `create-space-columns`, `create-space-rows`, `create-space-depth`, `create-space-submit`) to ensure backwards compatibility with `apps/web/e2e/space-manager.spec.ts`.

### 4. Storybook and screenshot recipes as visual verification gates

Per the recorded decision on `sm-xfg1`, visual refinement relies on:

- Storybook stories for isolated component states (`apps/web/src/ui/spaceManager/CreateSpaceDialog.stories.tsx`, `apps/web/src/ui/AppHeader.stories.tsx`, etc.).
- Playwright screenshot recipes in `apps/web/scripts/screenshot-recipes.ts` and `apps/web/scripts/screenshot.ts` to capture full-page and component baselines into `.screenshots/`.
- Google Stitch used as a supplementary tool for exploratory layouts and variant inspiration before building components.

## Package impacts and code verification

The following files and symbols were verified via tree inspection:

- `apps/web/src/ui/App.tsx`: Currently renders root layout, tab navigation, and mounts `Toolbar`, `ConstraintEditorPanel`, `LayoutCanvas`, `BOMPanel`, and `OptionsPanel`.
- `apps/web/src/ui/Toolbar.tsx`: Currently mounts mode buttons, export/import, `GoldenPathSetup`, `SpaceManager`, and `ThemeToggle`.
- `apps/web/src/ui/GoldenPathSetup.tsx`: Exports `GoldenPathSetup` rendering starter fixture buttons.
- `apps/web/src/ui/spaceManager/SpaceManager.tsx`: Exports `SpaceManager` combining `CreateSpaceFormPanel` and `SpaceSwitcher`.
- `apps/web/src/ui/spaceManager/CreateSpaceFormPanel.tsx`: Exports `CreateSpaceFormPanel` containing inline inputs.
- `apps/web/src/ui/spaceManager/SpaceSwitcher.tsx`: Exports `SpaceSwitcher` mapping over `spaces`.
- `apps/web/src/ui/LayoutCanvas.tsx`: Exports `LayoutCanvas` managing 2D canvas drawing and viewport fit.
- `apps/web/src/ui/theme/ThemeToggle.tsx`: Exports `ThemeToggle` for theme switching.
- `apps/web/scripts/screenshot-recipes.ts`: Exports `SCREENSHOT_RECIPES` used by `bun run screenshot`.

No packages outside `apps/web` are modified.

## Risks and mitigations

- **Risk: E2E test breakage from moving controls into menus/dialogs.**
  _Mitigation:_ Keep existing test IDs intact and ensure the dev menu or space manager dialog can either be opened by tests or remains transparently queryable.
- **Risk: CSS token inconsistencies.**
  _Mitigation:_ Use only design tokens defined in `apps/web/src/index.css` (`@theme`), validated by `bun run lint`.
