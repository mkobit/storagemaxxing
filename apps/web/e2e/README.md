# Web end-to-end tests (`apps/web/e2e`)

## Overview

Playwright Chromium end-to-end test suite verifying user journeys, 2D/wireframe canvas rendering, persistence, theme/typography tokens, and installation-constraint fixtures.

## Interface

- `[akromils-bin-selection.spec.ts]` Verifies Akro-Mils packing invalidation/recovery and `create-space-system` catalog filtering (Journey 3).
- `[bom-panel.spec.ts]` Verifies `bom-panel` renders non-`none` `backdrop-filter` in light and dark themes.
- `[catalog-bin-colors.spec.ts]` Verifies added Gridfinity bins render distinct palette colors (`#4e79a7`, `#f28e2b`) within canvas viewport bounds.
- `[constraint-edit-refresh.spec.ts]` Verifies editing `Min:` counts and swapping bins immediately refreshes canvas output and validity badges (Journey 4).
- `[constraint-editor-panel.spec.ts]` Verifies `constraint-editor-panel` `backdrop-filter`, non-zero Schaller label widths, and grid accessory additions.
- `[golden-path.spec.ts]` Verifies `GoldenPathSetup` presets, mode switching (`partial` to `valid`), IndexedDB persistence across reload, and JSON sketch export/import.
- `[installation-constraints.spec.ts]` Verifies `drillable-toggle` defaults and two `@drill-fixture` scenarios blocking/removing `test-drill-bin` under `noDrill`.
- `[multi-space-bom.spec.ts]` Verifies aggregated multi-space BOM quantities across two Gridfinity drawers (Journey 2).
- `[multi-space-round-trip.spec.ts]` Verifies multi-space IndexedDB reload persistence and JSON export/import round-trip (Journey 5).
- `[options-mode.spec.ts]` Verifies Options Mode empty state, four neutral system cards without winner badges, and `select-and-customize` strategy application.
- `[smoke.spec.ts]` Verifies root route `/` renders `toolbar` and `mode-select`.
- `[space-manager.spec.ts]` Verifies canvas grid stroke aspect ratios (`#666666`) and switching between active spaces.
- `[theme.spec.ts]` Verifies `theme-toggle` persistence across reload and fallback on corrupted `localStorage`.
- `[typography.spec.ts]` Verifies `Outfit` heading and `Inter` control font families.
- `[visual.spec.ts]` Verifies visual regression baselines across default light/dark workspace, packed Gridfinity drawer, Options Mode cards, and BOM panel.
- `[wireframe-toggle.spec.ts]` Verifies `wireframe-toggle` `aria-pressed` transitions preserve canvas visibility and `"valid"` status.
- `[workshop-drawer-planning.spec.ts]` Verifies creating a `14x10x2` Gridfinity drawer and adding multiple bins to a `"valid"` layout (Journey 1).
- Subdirectories:
  - [E2E fixtures](./fixtures/README.md) — Synthetic `test-drill-bin` catalog module alias activated by `E2E_DRILL_FIXTURE=true`.

## Invariants

- `apps/web/playwright.config.ts` partitions specs across `chromium` (`grepInvert: /@drill-fixture/`, `127.0.0.1:${PORT}`) and `chromium-e2e-fixtures` (`grep: /@drill-fixture/`, `127.0.0.1:${DRILL_PORT}`, `E2E_DRILL_FIXTURE: "true"`), allocating distinct ephemeral ports when `PORT` is unset.
- Playwright runs with `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: CI ? 2 : 0`, `workers: CI ? 2 : undefined`, and `reuseExistingServer: false`.
- Specs are typechecked by `apps/web/tsconfig.json`, ESLint-ignored in `eslint.config.ts`, and excluded from root `bun test` (`bunfig.toml` sets `root = "packages"`).

## Side effects

- Builds static production bundles into `apps/web/dist/e2e-default` and `apps/web/dist/e2e-drill`, spawns two `vite preview` servers on `127.0.0.1`, launches headless Chromium, and mutates DOM, canvas pixels, IndexedDB (`storagemaxxing-db`), and `localStorage` (`storagemaxxing-theme`).
- Triggers browser downloads (`storagemaxxing-sketch.json`) and uploads, and writes test outputs under `apps/web/playwright-report/` and `apps/web/test-results/`.

## Verification

- Run: `bun run --filter @storagemaxxing/web test:e2e`
- Run: `bun run sbx:test:e2e`
- Update visual baselines (Linux): `bun run --filter @storagemaxxing/web test:e2e -- --update-snapshots=all visual.spec.ts`
