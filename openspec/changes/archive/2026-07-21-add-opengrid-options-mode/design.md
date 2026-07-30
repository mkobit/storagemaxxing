## Context

`packages/store/src/layoutSelectors.ts:104` defines `COMPARABLE_SYSTEMS = ["schaller", "gridfinity", "akromils"] as const`, and `ComparableStorageSystem` (line 105) is derived from it via `(typeof COMPARABLE_SYSTEMS)[number]`.
`selectOptionsModeStrategies` (line 140) already `reduce`s generically over `COMPARABLE_SYSTEMS` — verified by reading the implementation, it has no hardcoded reference to any of the three system names, so widening the array is sufficient; no selector logic changes.
`apps/web/src/ui/options/OptionsPanel.tsx:11-15` independently hardcodes `SYSTEMS: readonly ComparableStorageSystem[] = ["schaller", "gridfinity", "akromils"]` and builds `cardMetricsBySystem` (lines 57-63) with one explicit key per system — this is a plain object literal, not a `reduce`, so it needs an explicit 4th key added.
The card grid (`OptionsPanel.tsx:72`) is `className="grid w-full grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-3"` — verified via grep that no other file in `apps/web/src` currently uses `grid-cols-4` at any breakpoint, so there is no existing convention to match; this design picks `md:grid-cols-4` as the direct analog of the existing `md:grid-cols-3`.
`apps/web/src/ui/options/StrategyCard.tsx:18-22` has `SYSTEM_LABELS: Readonly<Record<ComparableStorageSystem, string>>` with one entry per system — also a plain object literal requiring an explicit 4th key.
`packages/catalog/src/StorageSystem.ts` already lists `opengrid` in `StorageSystemSchema` alongside `schaller`, `gridfinity`, `akromils`, `custom` — confirmed via `Read`, no schema change needed.
`packages/catalog/src/lookup.ts:8-13` already spreads `OPENGRID_CATALOG` into `ALL_BINS` — confirmed via `Read`, so `selectOptionsModeStrategies`'s default `catalog = ALL_BINS` parameter already carries opengrid `BinSpec`s; the selector will start producing non-empty results for `opengrid` the moment it is added to `COMPARABLE_SYSTEMS`, with zero catalog-layer changes.

Two test files assert the fixed 3-way set by name and need a 4th expected value:

- `apps/web/src/ui/options/OptionsPanel.test.tsx`: `"renders exactly one card per comparable system"` asserts `strategy-card-schaller`, `strategy-card-gridfinity`, `strategy-card-akromils` exist — confirmed via `Read`, needs `strategy-card-opengrid` added.
- `packages/store/test/options-mode-strategies.test.ts`: `"returns one resolved LayoutResolution per comparable system"` asserts `Object.keys(strategies).sort()` equals `["akromils", "gridfinity", "schaller"]` — confirmed via `Read`, needs `"opengrid"` inserted in sorted order (`["akromils", "gridfinity", "opengrid", "schaller"]`).

## Data flow

```
COMPARABLE_SYSTEMS (layoutSelectors.ts)
  ["schaller", "gridfinity", "akromils", "opengrid"]
        │
        ▼
selectOptionsModeStrategies(template, ALL_BINS)
  reduce over COMPARABLE_SYSTEMS
        │  (already generic — no change)
        ▼
Record<ComparableStorageSystem, LayoutResolution>
  { schaller: ..., gridfinity: ..., akromils: ..., opengrid: ... }
        │
        ▼
OptionsPanel.tsx
  SYSTEMS = [...COMPARABLE_SYSTEMS]  (4 entries)
  cardMetricsBySystem { schaller, gridfinity, akromils, opengrid }  (explicit 4th key)
  <div className="... md:grid-cols-4">
    SYSTEMS.map(system => <StrategyCard system={system} .../>)
        │
        ▼
StrategyCard.tsx
  SYSTEM_LABELS[system]  (explicit 4th entry: opengrid → "OpenGrid")
```

No new Zod schema — `ComparableStorageSystem` remains a plain derived TS type (`(typeof COMPARABLE_SYSTEMS)[number]`), not a Zod enum; `StorageSystemSchema` (the actual Zod schema) already includes `opengrid`.

## Goals / Non-Goals

**Goals:**

- Add `"opengrid"` to `COMPARABLE_SYSTEMS` in `packages/store/src/layoutSelectors.ts`.
- Add `"opengrid"` to `SYSTEMS` and the `opengrid` key to `cardMetricsBySystem` in `apps/web/src/ui/options/OptionsPanel.tsx`.
- Add `opengrid: "OpenGrid"` to `SYSTEM_LABELS` in `apps/web/src/ui/options/StrategyCard.tsx`.
- Change the card grid from `md:grid-cols-3` to `md:grid-cols-4` so 4 cards lay out legibly on desktop widths.
- Update `openspec/specs/options-mode/spec.md`'s "Cross-System Strategy Comparison" requirement and scenarios from 3-way to 4-way.
- Update the two existing tests that assert the fixed system set by name (`OptionsPanel.test.tsx`, `options-mode-strategies.test.ts`) to expect the 4th system.

**Non-Goals:**

- No new selector, store action, or Zod schema — every piece `opengrid` needs (catalog entries, `StorageSystemSchema` member, generic `reduce` in `selectOptionsModeStrategies`) already exists.
- No change to `applySpaceStrategy` or the "Select & Customize" commit flow — committing an `opengrid` strategy already works today for any `StorageSystem`; only the _preview_ comparison screen was missing the 4th card.
- No `custom` card — `custom` has no fixed catalog (per the original options-mode design's non-goals) and stays excluded.
- No visual redesign of `StrategyCard` itself — same card component, same metrics block, just one more instance and a wider grid.

## Decisions

- **Widen the existing `const` array rather than deriving `ComparableStorageSystem` from `StorageSystemSchema` minus `custom`.** The original design already chose an explicit fixed array over "all storage systems" specifically so a future system (like `opengrid` was, until now) doesn't silently appear in the comparison before its catalog is ready. Keeping that pattern means adding `opengrid` is a deliberate, reviewable one-line diff — not an automatic consequence of a catalog change — consistent with how this same addition itself required a product decision (`sm-gwty`) rather than shipping automatically alongside `sm-qrai`.
- **`md:grid-cols-4` over a `xl:grid-cols-4` staged breakpoint.** The existing grid already jumps straight from `grid-cols-1` to `md:grid-cols-3` with no intermediate 2-column step; four cards at the `md` breakpoint (≥768px) follows the same one-step pattern rather than introducing a new breakpoint tier this component didn't have before.
- **No change to `toCardMetrics` or `StrategyCard`'s internal layout.** Its `dl` grid (`grid-cols-3` for utilization/bins/SKUs) is per-card, not per-system-count, so it is unaffected by adding a 4th card.

## Risks / Trade-offs

- **Narrower cards at `md` width.** Four cards at `md:grid-cols-4` are narrower per-card than three at `md:grid-cols-3` for the same viewport; the metrics `dl` is already a compact 3-column grid inside each card, so this is a visual density increase, not a layout break — worth a manual check in a real browser at the `md` breakpoint before merging, per this repo's UI-change convention (`bun run dev` + screenshot).
- **Test churn is mechanical, not logical.** Both test updates are additive expected-value changes (`Object.keys(...).sort()` gains one entry, a new `data-testid` assertion is added) — no test is deleted or has its assertion direction changed, so there is no risk of silently weakening coverage.

## Adversarial Audit

- **Does `selectOptionsModeStrategies` silently break if a system has zero eligible bins for a given template?** No — verified via `Read` of `packages/store/test/options-mode-strategies.test.ts`, an existing test (`"a system with zero height-eligible bins resolves with zero placements, not a throw"`) already covers exactly this path for `gridfinity`; the same `resolveStrategy` function runs unconditionally for `opengrid`, so a template where every `opengrid` bin is height-ineligible resolves to a zero-metric card, not an error — same as any other system today.
- **Does `isBinInstallationAllowed` (used inside `buildAutoFillConstraints`) apply uniformly to `opengrid` bins?** Yes — it filters on `bin.installation`, a field on `BinSpec` independent of `system`; nothing in `buildAutoFillConstraints` special-cases the three original systems.
- **Could the sorted-keys test assertion (`options-mode-strategies.test.ts`) silently pass with the wrong insertion point?** No — `Object.keys(...).sort()` sorts alphabetically regardless of `COMPARABLE_SYSTEMS`'s declaration order, so `"opengrid"` must land between `"gridfinity"` and `"schaller"` alphabetically (`akromils, gridfinity, opengrid, schaller`); this is called out explicitly in Context above so implementation doesn't append it at the end and get a spurious failure.
- **Does the `best-value highlighting` logic (`Math.max` over `allMetrics`) break with a 4th entry?** No — `bestUtilization`/`bestBinCount`/`bestSkuCount` in `OptionsPanel.tsx` are computed via `Math.max(...allMetrics.map(...))` over whatever `SYSTEMS` contains; this is already count-agnostic, confirmed by reading the implementation (no `[0]`/`[1]`/`[2]` indexing).
- **Sync conflict check:** no other in-progress OpenSpec change touches `options-mode`, `OptionsPanel.tsx`, `StrategyCard.tsx`, or `layoutSelectors.ts` — confirmed via `bunx openspec list --json` (empty `changes` array before this change was created).
