# Options UI

## Overview

Implements the Options mode UI (`OptionsPanel` and `StrategyCard`) and its Storybook stories for comparing storage strategies (`schaller`, `gridfinity`, `akromils`, `opengrid`) on the active space. Computes per-strategy utilization, bin count, and SKU count via `toCardMetrics`, highlights the maximum value in each metric, and applies a chosen strategy to the store.

## Interface

- `[OptionsPanel.tsx:OptionsPanel]` `React.FC<OptionsPanelProps>` accepting `{ readonly onStrategyApplied?: () => void }`.
- `[StrategyCard.tsx:StrategyCard]` `React.FC<StrategyCardProps>` accepting `{ system: ComparableStorageSystem, resolution: LayoutResolution, isBestUtilization: boolean, isBestBinCount: boolean, isBestSkuCount: boolean, onSelectAndCustomize: () => void }`.
- `[toCardMetrics.ts:toCardMetrics]` `(result: PackingResult) => { readonly utilizationPct: number; readonly binCount: number; readonly skuCount: number }`.
- `[OptionsPanel.stories.tsx:default]` Storybook Meta and `StoryObj` exports (`NoActiveSpace`, `StrategyComparisonCards`, `AppliedGridfinityStrategy`, `AppliedSchallerStrategy`, `TopAccessDrawer`) for `OptionsPanel`.
- `[StrategyCard.stories.tsx:default]` Storybook Meta and `StoryObj` exports (`Default`, `BestInEveryMetric`, `Empty`) for `StrategyCard`.

## Invariants

- `[OptionsPanel.tsx:SYSTEMS]` Compares a fixed list of four `ComparableStorageSystem` values: `'schaller'`, `'gridfinity'`, `'akromils'`, `'opengrid'`.
- `[OptionsPanel.tsx:OptionsPanel]` Renders fallback `'No active space selected'` when `activeSpace` or `strategies` is undefined.
- `[OptionsPanel.tsx:toCardMetricsOrZero]` Maps non-`'resolved'` `LayoutResolution` values to `{ utilizationPct: 0, binCount: 0, skuCount: 0 }`.
- `[StrategyCard.tsx:StrategyCard]` Maps non-`'resolved'` `LayoutResolution` values to zeroed metrics and empty `placedCounts` (`{}`), and filters expanded bin list to entries with `count > 0`.
- `[toCardMetrics.ts:toCardMetrics]` Computes `utilizationPct` as `areaUtilization * 100`, `binCount` as the sum of `placedCounts` values, and `skuCount` as the count of `placedCounts` entries `> 0`.

## Side effects

- `[OptionsPanel.tsx:OptionsPanel]` Reads `activeSpace`, `templatesById`, and `applySpaceStrategy` from `useStore`; `onSelectAndCustomize` calls `applySpaceStrategy(activeSpace.id, system)` and `onStrategyApplied?.()`.
- `[StrategyCard.tsx:StrategyCard]` Toggles local React state (`expanded`) via `setExpanded` on View Layout button click.
- `[OptionsPanel.stories.tsx]` Story decorators mutate global store state via `useStore.setState(...)` and `useStore.getState().applySpaceStrategy(...)`.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
