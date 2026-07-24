## Why

sm-6tip investigated e2e coverage of the `noDrill` installation-constraint exclusion path (a bin greyed out in Add Bins and excluded from packing when `noDrill` is set) and found it not achievable with real catalog data.
No entry across the four real catalog sources (Schaller, Gridfinity, Akro-Mils, openGrid) sets `installation.type = "drill"` — Gridfinity/openGrid snap into baseplates, Schaller is rail/drawer-mount, and Akro-Mils "Stack & Hang" bins hang or snap onto pegboard.
A genuinely drill-mounted product in this domain is mounting infrastructure (French cleat, louvered panel, drilled track), not a packable container `BinSpec` is built to represent — annotating an existing SKU as `drill` would misrepresent it, and adding a new vendor/system is disproportionate to closing a test gap.
`apps/web/e2e` specs also have no test-seeding seam today: no spec uses `page.route()` for network/JSON mocking, and the catalog is a static Vite-bundled ESM import (`ALL_BINS` in `packages/catalog/src/lookup.ts`), not fetched data — so there is nothing to intercept.
sm-6tip shipped only the `noDrill`-unset default-path e2e test as a human-approved scope narrowing.
Drill exclusion is already covered at the unit/component level (`ConstraintEditorPanel.test.tsx` uses Bun's `mock.module` to override `@storagemaxxing/catalog/lookup` with a synthetic `test-drill-bin`), but that coverage doesn't exercise the real browser/DOM/packing pipeline the way e2e does.
This change closes that e2e gap without touching production catalog data.

## What Changes

- Add a dev/test-only fixture seam, gated by a Vite `import.meta.env` flag, that appends the same synthetic drill-bin fixture already used in `ConstraintEditorPanel.test.tsx` (id `test-drill-bin`, `system: "gridfinity"`, `installation: { type: "drill", ... }`) to `ALL_BINS` at runtime.
- The flag is read once at module load in `packages/catalog/src/lookup.ts` (or a thin wrapper apps/web imports), defaults to off, and is only ever set true by a dedicated Playwright project's `webServer` env — never by `bun run dev` or production builds.
- Production builds dead-code-eliminate the fixture branch (Vite statically replaces `import.meta.env.*` at build time, so the unused branch and the fixture data are stripped).
- Extend `apps/web/e2e/installation-constraints.spec.ts` to cover the previously-unreachable path: bin greyed/disabled in Add Bins when `noDrill` is set, and the packed layout excludes it.
- No change to `noDrill` runtime behavior, constraint evaluation logic, or any existing catalog entry.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `automated-verification`: adds a requirement establishing a test-only fixture injection seam for e2e coverage of constraint paths that have no defensible real-catalog data, scoped to dev/test builds only and excluded from production output.

## Impact

- **Affected packages (DAG):** `packages/catalog` (adds the env-gated fixture append in `lookup.ts` or an adjacent module; no change to `geometry`, `assembly`, or `packer`), `apps/web` (Playwright config gains a dedicated project/webServer env var; `installation-constraints.spec.ts` gains the drill-exclusion assertions).
- **No changes to:** `packages/geometry`, `packages/assembly`, `packages/packer`, `packages/store`, or any real catalog SKU data.
- **Test surface:** new Playwright project only runs against the fixture-enabled dev server; existing e2e projects and unit tests are unaffected.

## Success Criteria

- `apps/web/e2e/installation-constraints.spec.ts` passes with new assertions covering: bin greyed/disabled in Add Bins when `noDrill` is set, and packed layout excludes it.
- A production build (`bun run --filter @storagemaxxing/web build`) contains no reference to `test-drill-bin` or the fixture-injection code path (verifiable via build output grep).
- `bun run lint` && `bun run typecheck` && `bun test` pass with no regressions to existing catalog, store, or e2e coverage.
