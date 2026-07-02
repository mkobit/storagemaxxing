# Tasks: Premium UI Design System

Generated from Beads (`bd query 'label=meta:openspec:premium-ui-design-system'`). Epic: `sm-czzu` (supersedes `sm-mllt`).

## 0. Review Gate

- [ ] `sm-odxr` premium-ui-design-system: design review
  - **Acceptance**: A human reviews `design.md` and `specs/web-design-system/spec.md` and closes this bead to unblock implementation.

## 1. Foundation

- [ ] `sm-ynun` Expand design tokens in index.css (color, spacing, radius, shadow, motion)
  - **Acceptance**: `bun run --cwd apps/web build` succeeds and the generated CSS contains `--shadow-glass`.
  - **Depends on**: `sm-odxr`

## 2. Features (parallel-safe once Foundation lands)

- [x] `sm-n7qt` Load Outfit/Inter fonts and define typography tokens
  - **Acceptance**: Playwright reads computed `font-family` on a heading (Outfit) and body text (Inter).
  - **Depends on**: `sm-ynun`
- [x] `sm-cmk3` Dark/light theme toggle with persisted override
  - **Acceptance**: Playwright toggles the theme, confirms the `.dark` class updates, and confirms it survives a reload.
  - **Depends on**: `sm-ynun`

## 3. Component Migration (depends on Foundation + theme toggle)

- [x] `sm-vj3p` Migrate ConstraintEditorPanel to token-driven glass panel styling
  - **Acceptance**: Playwright confirms non-`none` `backdrop-filter` in both themes; no inline hex literals remain.
  - **Depends on**: `sm-ynun`, `sm-cmk3`
- [ ] `sm-4gqq` Migrate BOMPanel to token-driven glass panel styling
  - **Acceptance**: Playwright confirms non-`none` `backdrop-filter` in both themes; no inline hex literals remain.
  - **Depends on**: `sm-ynun`, `sm-cmk3`
- [ ] `sm-xwtr` Migrate Toolbar, GoldenPathSetup, ValidityBadge, and App shell to design tokens
  - **Acceptance**: No inline hex literals remain in `App`/`Toolbar`/`GoldenPathSetup`/`ValidityBadge`; `LayoutCanvas`/`GridVisualizer` have no `backdrop-filter`.
  - **Depends on**: `sm-ynun`, `sm-cmk3`
