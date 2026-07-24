## Context

`ALL_BINS` from `@storagemaxxing/catalog/lookup` is imported directly by five apps/web UI modules (`LayoutCanvas.tsx`, `BOMPanel.tsx`, `bom/BOMRow.tsx`, `bom/BOMHeader.tsx`, `ConstraintEditorPanel.tsx`) **and** by two `packages/store` modules (`layoutSelectors.ts`, `useStore.ts`) — verified by grep, not inferred.
Critically, `packages/store/src/layoutSelectors.ts:10-17` defines `isBinInstallationAllowed`, and `resolveSpace` (same file, lines 72-81) uses it to filter which added-constraint bins actually reach `packSpace` — this is the code that excludes a drill bin from the packed layout once `noDrill` is set, and it resolves its own `ALL_BINS` at module scope (`useStore.ts:65` passes `ALL_BINS` into `applyStrategyInState`).
This means a fixture-injection seam confined to `apps/web` (e.g. a wrapper module only UI components import) would **not** reach the store's packing/exclusion path — the packed-layout-exclusion half of this bead's acceptance criteria would silently not exercise the real code.
The seam must be visible at the `@storagemaxxing/catalog/lookup` module-resolution boundary itself, for every importer.

`apps/web/vite.config.ts` already aliases `@storagemaxxing/catalog` straight to `packages/catalog/src` (no build step), and this same alias resolution applies uniformly across the whole bundled module graph — including `packages/store`'s imports — when Vite bundles `apps/web`.

The Add Bins list (`ConstraintEditorPanel.tsx:171-179`) renders `data-testid={`add-bin-${bin.id}`}`, disabled when `!installationAllowed`.
Added constraints render `data-testid={`constraint-row-${c.binId}`}` (`ConstraintEditorPanel.tsx:117`).
The existing synthetic fixture (`apps/web/src/ui/ConstraintEditorPanel.test.tsx:23-34`) already defines the exact bin shape to reuse: id `test-drill-bin`, `system: "gridfinity"`, `catalogSource: "builtin"`, `installation: { type: "drill", description: "Requires drilling" }`.

## Goals / Non-Goals

**Goals:**

- Make the synthetic `test-drill-bin` fixture visible to every real importer of `@storagemaxxing/catalog/lookup` (UI and store), but only when a dedicated Playwright project's dev server is started with an explicit opt-in.
- Extend `apps/web/e2e/installation-constraints.spec.ts` with scenarios covering: (1) the bin is greyed/disabled in Add Bins once `noDrill` is set, (2) a previously-added instance of the bin is dropped from the packed layout once `noDrill` is set.
- Leave `packages/catalog` and `packages/store` byte-for-byte unchanged — this is a test-infrastructure concern, not a domain change.
- Guarantee zero fixture presence in `bun run --filter @storagemaxxing/web build` output.

**Non-Goals:**

- Classifying any real catalog SKU as `installation.type: "drill"` (rejected in the proposal — no real product is a defensible fit).
- A general-purpose e2e mocking/fixture framework. This seam is scoped to one fixture bin for one exclusion path; broader e2e data-seeding is out of scope.
- Changing `noDrill` runtime behavior, `isBinInstallationAllowed`, or any packing logic.

## Decisions

**1. Alias-swap in `apps/web/vite.config.ts`, keyed off a Node-side `process.env` flag — not `import.meta.env`.**

```
resolve.alias["@storagemaxxing/catalog/lookup"] =
  process.env.E2E_DRILL_FIXTURE === "true"
    ? path.resolve(__dirname, "e2e/fixtures/catalogWithDrillFixture.ts")
    : path.resolve(__dirname, "../../packages/catalog/src/lookup.ts")
```

`vite.config.ts` runs in Node/Bun at config-eval time (dev-server startup / build start), so `process.env` is the correct read — this is a config-time module-graph decision, not a client-bundle conditional.
Because the fixture module is only ever *referenced* when the alias points at it, production builds (`E2E_DRILL_FIXTURE` unset) never resolve or bundle it — this is stronger than dead-code elimination of an `import.meta.env` branch; the module is simply not part of the graph.

This is the reason for putting the swap in `apps/web/vite.config.ts` rather than inside `packages/catalog/src/lookup.ts`: it keeps `packages/catalog` (Engineering Rails: functional purity, no side effects) completely untouched and avoids coupling it to a Vite-specific mechanism, while still covering `packages/store`'s direct `ALL_BINS` import — Vite's alias substitution applies to every import of that specifier in the bundled graph regardless of which package the importing file lives in.

**2. New fixture module: `apps/web/e2e/fixtures/catalogWithDrillFixture.ts`.**

Re-exports `findBinById` and `binsForDepth` unchanged from the real `lookup.ts`, and re-exports `ALL_BINS` as `[...REAL_ALL_BINS, drillBin]`, where `drillBin` is the identical literal already reviewed in `ConstraintEditorPanel.test.tsx` (same id, fields, and values — copied, not redefined differently, so unit and e2e coverage exercise the same fixture).
`apps/web/e2e` is already inside `apps/web/tsconfig.json`'s `include` array (verified) — no tsconfig change needed.

**3. New Playwright project `chromium-e2e-fixtures` with its own `webServer` entry.**

`vite.config.ts`'s `server.port` becomes `Number(process.env.PORT ?? 5173)` (currently hardcoded `5173` with `strictPort: true`).
The new project's `webServer` sets `env: { E2E_DRILL_FIXTURE: "true", PORT: "5174" }` and `command: "bun run dev"`, with `use.baseURL: "http://localhost:5174"`.
This lets both webServers (default + fixture) run side by side without a port clash when the full suite runs.

**4. New scenarios added to the existing `installation-constraints.spec.ts` file, tagged `{ tag: "@drill-fixture" }`.**

The default `chromium` project's config gets `grepInvert: /@drill-fixture/`; the new `chromium-e2e-fixtures` project gets `grep: /@drill-fixture/`.
This keeps the acceptance criteria's file reference (`apps/web/e2e/installation-constraints.spec.ts`) accurate while giving each project a disjoint, correctly-catalog'd set of tests — the default project never attempts to resolve `add-bin-test-drill-bin`, which wouldn't exist against its (real-catalog) dev server.

New scenario outline, grounded in the existing testid conventions (`add-bin-${bin.id}`, `constraint-row-${c.binId}`, `drillable-toggle`):

```
test("drill-mount bin is disabled in Add Bins once noDrill is set", { tag: "@drill-fixture" }, ...)
  - create a space, toggle drillable-toggle off (noDrill set)
  - expect add-bin-test-drill-bin to be disabled

test("drill-mount bin already added is dropped from packed layout once noDrill is set", { tag: "@drill-fixture" }, ...)
  - create a space with drillable-toggle left on (default)
  - add-bin-test-drill-bin, expect constraint-row-test-drill-bin visible
  - toggle drillable-toggle off
  - expect the packed layout / BOM to no longer list test-drill-bin
    (resolveSpace drops it from `allowed` per layoutSelectors.ts:72-81,
    independent of whether the constraint-row itself remains rendered)
```

The second scenario's exact "packed layout no longer lists it" locator (canvas pixel check vs. BOM row absence) is an implementation-time detail to confirm against `BOMRow.tsx`/`LayoutCanvas.tsx` rendering, not a design-level decision — reuse whatever existing e2e specs already assert on for BOM contents (e.g. `catalog-bin-colors.spec.ts`, `golden-path.spec.ts`) rather than inventing a new assertion style.

**Data flow diagram:**

```
                         apps/web/vite.config.ts
                resolve.alias["@storagemaxxing/catalog/lookup"]
                                    │
                  process.env.E2E_DRILL_FIXTURE === "true" ?
                 ┌───────────────────┴───────────────────┐
                no (default, prod build)                yes (chromium-e2e-fixtures only)
                 │                                         │
                 ▼                                         ▼
   packages/catalog/src/lookup.ts            apps/web/e2e/fixtures/catalogWithDrillFixture.ts
   ALL_BINS = real catalog only               ALL_BINS = real catalog + test-drill-bin
                 │                                         │
                 └───────────────────┬─────────────────────┘
                                     ▼
      every importer resolves the SAME module identity for "@storagemaxxing/catalog/lookup":
      apps/web/src/ui/{ConstraintEditorPanel,LayoutCanvas,BOMPanel,bom/BOMRow,bom/BOMHeader}.tsx
      packages/store/src/{layoutSelectors,useStore}.ts  ← includes isBinInstallationAllowed's
                                                            catalog and applyStrategyInState's
                                                            default catalog, so packing/exclusion
                                                            logic sees the fixture too.
```

**Zod schemas:** no new domain objects. `drillBin` is a plain `BinSpec` literal (existing type from `packages/catalog/src/bin.ts`) with an `InstallationRequirement` (existing type) — both already validated by `packages/catalog`'s Zod schemas; nothing new to specify.

## Risks / Trade-offs

- **Two dev-server instances during full e2e runs** (ports 5173 and 5174) increase local/CI resource use and startup time versus a single server. Scoped to CI's e2e job only; not a build or unit-test cost.
- **Divergence risk between the unit-test fixture and the e2e fixture module** if one is edited without the other — mitigated by literally copying the same field values, but there is no shared single source of truth (`ConstraintEditorPanel.test.tsx` uses `mock.module`, which cannot be reused by Vite's alias mechanism). A future cleanup could extract the shared literal into `packages/catalog` test-utilities if this pattern is needed for a second fixture, but that's speculative and out of scope here (functional purity rules already forbid it from `lookup.ts` itself).
- **`process.env.PORT` now overrides the previously-hardcoded dev port** for anyone running `bun run dev` with a stray `PORT` env var set (e.g. from an unrelated tool). Low risk — no existing script or CI step sets `PORT` today (not grepped as a false claim here — to be verified during implementation before merging the `vite.config.ts` change).
- **Alias-swap is a global, whole-graph substitution** — if any future code path needs the *real* catalog specifically while running under the fixture project (unlikely, but e.g. a "compare against real catalog" test), it has no way to opt out per-import. Not needed by this bead's scope.

## Adversarial Audit

- **Does the fixture actually reach `packSpace`, or only the UI?** Traced: `ConstraintEditorPanel.tsx` → `handleAddBinConstraint` → store action → `useStore.ts` `applyStrategyInState(state, spaceId, system, ALL_BINS)` and `layoutSelectors.ts` `resolveSpace`/`selectPackedLayout` both default/receive `ALL_BINS` from the same `@storagemaxxing/catalog/lookup` specifier the alias swap intercepts. Confirmed reachable — this is the entire reason Decision 1 rejects an apps/web-only wrapper.
- **Could Vite's `optimizeDeps` pre-bundling cache a stale (non-fixture) copy of `lookup.ts` between the default and fixture dev-server runs?** Each Playwright project's `webServer` starts its own `bun run dev` process with its own `E2E_DRILL_FIXTURE`/`PORT` env, so each gets a fresh Vite instance and its own `node_modules/.vite` cache keyed by config; no shared-process cache risk. Should still confirm empirically during implementation that a `.vite` cache dir isn't accidentally shared/committed.
- **Does `grepInvert`/`grep` tag filtering actually exclude the fixture tests from the default project, or only de-prioritize them?** Playwright's `grep`/`grepInvert` at the project level fully excludes non-matching tests from that project's run (not just ordering) — this is documented Playwright behavior, not novel to this design, but must be verified against the installed `1.61.1` version during implementation (`bunx playwright test --list` per project) before relying on it in CI.
- **Does adding a second `webServer` entry change existing CI timing/flakiness for the untouched default project?** `webServer` accepts an array; Playwright starts all declared servers before running any project, in parallel by default. If CI is resource-constrained, two dev servers starting concurrently could slow the existing golden-path job. Flag for measurement after implementation, not a blocker for this design.
- **Is `test-drill-bin`'s `system: "gridfinity"` value going to collide with any real Gridfinity SKU id or filtering logic** (e.g. `buildAutoFillConstraints` filters by `bin.system === system`)? The id `test-drill-bin` is namespaced distinctly from every real catalog id (checked: real ids follow `<vendor>-<dims>` patterns, e.g. `schaller-1x1x2`; `binId()` only validates non-empty string, no format constraint) — no collision, but this SKU will appear in `buildAutoFillConstraints`'s Gridfinity auto-fill candidates when the fixture is active, which is expected (it's meant to look like a real Gridfinity-system bin) and should not itself be asserted against in the new scenarios (auto-fill behavior is out of scope; only manual Add Bins + packed-layout exclusion are).
