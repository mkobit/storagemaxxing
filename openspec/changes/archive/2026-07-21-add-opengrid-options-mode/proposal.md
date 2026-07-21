## Why

Options Mode's cross-system comparison is hardcoded to three systems (`schaller`, `gridfinity`, `akromils`), pinned when the feature originally shipped (`2026-07-20-options-mode`).
That change deliberately excluded `opengrid` because it had no catalog entries at the time.
`sm-qrai` has since shipped a real `opengrid` catalog (`packages/catalog/src/opengrid.ts`, 36 `BinSpec`s), and `opengrid` is already selectable when creating a space.
It is the only comparable, purchasable system (unlike `custom`) left out of the comparison screen, which is an inconsistency now that its catalog is real.
A product decision (bead `sm-gwty`) confirmed opengrid should join the comparison.

## What Changes

- Widen the comparison from 3-way to 4-way by adding `opengrid` alongside `schaller`, `gridfinity`, `akromils`.
- `packages/store/src/layoutSelectors.ts`: add `"opengrid"` to `COMPARABLE_SYSTEMS`, which widens the derived `ComparableStorageSystem` type and `selectOptionsModeStrategies`'s return type — no new logic, the existing reduce over `COMPARABLE_SYSTEMS` already handles an arbitrary-length set.
- `apps/web/src/ui/options/OptionsPanel.tsx`: add `"opengrid"` to `SYSTEMS`, add the `opengrid` key to `cardMetricsBySystem`, and change the card grid from `md:grid-cols-3` to `md:grid-cols-4` (or an equivalent responsive breakpoint that stays legible with 4 cards).
- `apps/web/src/ui/options/StrategyCard.tsx`: add an `opengrid: "OpenGrid"` entry to `SYSTEM_LABELS`.
- `openspec/specs/options-mode/spec.md`: update the "Cross-System Strategy Comparison" requirement and its scenarios from a fixed 3-way set to a fixed 4-way set.

No new selectors, store actions, or Zod schema — `opengrid` is already a `StorageSystemSchema` member and already has catalog entries in `ALL_BINS`, so this is purely widening an existing fixed array plus updating the pinned spec text and UI layout to match.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `options-mode`: "Cross-System Strategy Comparison" requirement changes from a fixed 3-way comparison (`schaller`, `gridfinity`, `akromils`) to a fixed 4-way comparison (`schaller`, `gridfinity`, `akromils`, `opengrid`).

## Impact

- **Packages touched:** `packages/store` (`COMPARABLE_SYSTEMS` widened), `apps/web` (`OptionsPanel.tsx`, `StrategyCard.tsx`).
- **Packages untouched:** `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer` — `opengrid` catalog and schema already exist.
- **Tests affected:** `apps/web/src/ui/options/OptionsPanel.test.tsx` (card-count assertion), `packages/store/test/options-mode-strategies.test.ts` (comparable-systems-key assertion) both need a 4th expected value.
- **No breaking change to committed spaces:** `applySpaceStrategy` and "Select & Customize" are unaffected; this only adds a 4th preview card.

## Success Criteria

- `openspec/specs/options-mode/spec.md` reflects a 4-way comparison including `opengrid`, with scenarios updated to match.
- Options Mode renders 4 strategy cards (`schaller`, `gridfinity`, `akromils`, `opengrid`) for any active space, laid out legibly on desktop widths.
- `bun test packages/store` and `bun test apps/web` pass with assertions updated for the 4th system.
- `bun run lint` and `bun run typecheck` pass with no DAG or type errors introduced.
