<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Vite dev-server config

- [x] 1.1 [sm-dfvo](../../../.beads) Add env-gated alias swap + configurable port to `apps/web/vite.config.ts`
  - Validation: `bun run --filter @storagemaxxing/web typecheck` passes; default dev server still binds port 5173 with `E2E_DRILL_FIXTURE` unset.

## 2. Fixture module

- [x] 2.1 [sm-910j](../../../.beads) Create `apps/web/e2e/fixtures/catalogWithDrillFixture.ts`
  - Validation: `bun run --filter @storagemaxxing/web typecheck` passes.

## 3. Playwright project wiring

- [x] 3.1 [sm-mty1](../../../.beads) Add `chromium-e2e-fixtures` project + second `webServer` to `apps/web/playwright.config.ts`
  - Validation: `bunx playwright test --list --project=chromium` shows no `@drill-fixture`-tagged test.

## 4. e2e scenarios

- [x] 4.1 [sm-njs6](../../../.beads) Add drill-exclusion e2e scenarios to `installation-constraints.spec.ts`
  - Validation: `bunx playwright test --project=chromium-e2e-fixtures apps/web/e2e/installation-constraints.spec.ts` passes both new scenarios.

## 5. Verification

- [x] 5.1 [sm-k0nk](../../../.beads) Verify prod build excludes drill fixture and default e2e project is unaffected
  - Validation: `bunx playwright test --project=chromium` unaffected; `bun run --filter @storagemaxxing/web build && ! grep -rq 'test-drill-bin' apps/web/dist`; `bun run lint && bun run typecheck && bun test` all pass.
