## Why

sm-6tip investigated e2e coverage of the `noDrill` installation-constraint exclusion path (a bin greyed out in Add Bins and excluded from packing when `noDrill` is set) and found it not achievable with real catalog data.
No entry across the four real catalog sources (Schaller, Gridfinity, Akro-Mils, openGrid) sets `installation.type = "drill"` — Gridfinity/openGrid snap into baseplates, Schaller is rail/drawer-mount, and Akro-Mils "Stack & Hang" bins hang or snap onto pegboard.
A genuinely drill-mounted product in this domain is mounting infrastructure (French cleat, louvered panel, drilled track), not a packable container `BinSpec` is built to represent — annotating an existing SKU as `drill` would misrepresent it, and adding a new vendor/system is disproportionate to closing a test gap.
`apps/web/e2e` specs also have no test-seeding seam today: no spec uses `page.route()` for network/JSON mocking, and the catalog is a static Vite-bundled ESM import (`ALL_BINS` in `packages/catalog/src/lookup.ts`), not fetched data — so there is nothing to intercept.
Existing specs do use `page.addInitScript()` (`theme.spec.ts`, seeding `localStorage`) and `page.evaluate()` (`catalog-bin-colors.spec.ts`, `golden-path.spec.ts`, `multi-space-round-trip.spec.ts`, `space-manager.spec.ts`), but neither reaches this gap: both run arbitrary JS against a page the dev server has already served, after Vite has resolved and bundled a single copy of the `@storagemaxxing/catalog/lookup` module graph for that server instance.
They can mutate global or DOM state, not change which module a static `import { ALL_BINS } from "@storagemaxxing/catalog/lookup"` resolves to.
A second, differently-aliased dev server is the only way to get a second resolved copy of that import.
sm-6tip shipped only the `noDrill`-unset default-path e2e test as a human-approved scope narrowing.
Drill exclusion is already covered at the unit/component level (`ConstraintEditorPanel.test.tsx` uses Bun's `mock.module` to override `@storagemaxxing/catalog/lookup` with a synthetic `test-drill-bin`), but that coverage doesn't exercise the real browser/DOM/packing pipeline the way e2e does.
This change closes that e2e gap without touching production catalog data.

## What Changes

- Add a dev/test-only fixture seam entirely within `apps/web`: a `resolve.alias` entry in `vite.config.ts`, keyed off a Node-side `process.env.E2E_DRILL_FIXTURE` flag (read at config-eval time, not `import.meta.env`), that points the `@storagemaxxing/catalog/lookup` specifier at a new fixture module instead of the real one.
- The fixture module (`apps/web/e2e/fixtures/catalogWithDrillFixture.ts`) re-exports the real `lookup.ts` exports unchanged, except `ALL_BINS`, which gains the same synthetic drill-bin fixture already used in `ConstraintEditorPanel.test.tsx` (id `test-drill-bin`, `system: "gridfinity"`, `installation: { type: "drill", ... }`).
- The flag defaults to off and is only ever set `"true"` by a dedicated Playwright project's `webServer` env — never by `bun run dev` or production builds.
- `packages/catalog` and `packages/store` are byte-for-byte unchanged; Vite's alias resolution applies uniformly to every importer of that specifier across the bundled module graph, so the swap reaches both UI components and `packages/store` without touching either package.
- Production builds never set the flag, so the fixture module is never referenced by the alias and is never resolved into the build graph at all — stronger than dead-code elimination of a conditional branch.
- Extend `apps/web/e2e/installation-constraints.spec.ts` to cover the previously-unreachable path: bin greyed/disabled in Add Bins when `noDrill` is set, and the packed layout excludes it.
- No change to `noDrill` runtime behavior, constraint evaluation logic, or any existing catalog entry.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `automated-verification`: adds a requirement establishing a test-only fixture injection seam for e2e coverage of constraint paths that have no defensible real-catalog data, scoped to dev/test builds only and excluded from production output.

## Impact

- **Affected packages (DAG):** none — this is entirely an `apps/web` test-infrastructure change (`vite.config.ts` alias + configurable port, new `e2e/fixtures/catalogWithDrillFixture.ts` module, `playwright.config.ts` gains a dedicated project and second `webServer`, `installation-constraints.spec.ts` gains the drill-exclusion assertions). No package in the `geometry → catalog → assembly → packer → store → web` DAG changes.
- **No changes to:** `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer`, `packages/store`, or any real catalog SKU data.
- **Test surface:** new Playwright project only runs against the fixture-enabled dev server; existing e2e tests and unit tests are functionally unaffected, but every Playwright invocation of this config now starts both `webServer` instances regardless of which project is filtered in (see design.md Risks — `webServer` is a global config field, not project-scoped).

## Success Criteria

- `apps/web/e2e/installation-constraints.spec.ts` passes with new assertions covering: bin greyed/disabled in Add Bins when `noDrill` is set, and packed layout excludes it.
- A production build (`bun run --filter @storagemaxxing/web build`) contains no reference to `test-drill-bin` or the fixture-injection code path (verifiable via build output grep).
- `bun run lint` && `bun run typecheck` && `bun test` pass with no regressions to existing catalog, store, or e2e coverage.
