# Constraints UI

## Overview

Provides React UI components (`ConstraintRow` and `ConstraintInputs`) and their Storybook stories for displaying and editing `SpaceConstraint` mode (`off`, `auto`, `soft`, `hard`) and min/max bounds for a bin.

## Interface

- `[ConstraintInputs.tsx:ConstraintInputs]` `React.FC<ConstraintInputsProps>` accepting readonly `constraint: SpaceConstraint`, `onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void`, and `onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void`.
- `[ConstraintRow.tsx:ConstraintRowProps]` Exported type with readonly `constraint: SpaceConstraint`, `binName: string`, `onChange: (constraint: SpaceConstraint) => void`, and optional `onDelete?: () => void`.
- `[ConstraintRow.tsx:ConstraintRow]` `React.FC<ConstraintRowProps>` rendering the bin name, mode `<select>` (`off`, `auto`, `soft`, `hard`), `ConstraintInputs`, and an optional remove button when `onDelete` is provided.
- `[ConstraintInputs.stories.tsx:default]` Storybook Meta for `ConstraintInputs` exporting stories `Soft`, `TypingMinCallsOnMinChange`, `Hard`, and `AutoModeRendersNothing`.
- `[ConstraintRow.stories.tsx:default]` Storybook Meta for `ConstraintRow` exporting stories `Auto`, `Off`, `Soft`, `Hard`, and `WithDelete`.

## Invariants

- `[ConstraintInputs.tsx:ConstraintInputs]` Returns `null` when `constraint.mode` is neither `"soft"` nor `"hard"`.
- `[ConstraintInputs.tsx:ConstraintInputs]` Sets Min `<input>` `min` attribute to `1` when `constraint.mode === "hard"` (otherwise `0`), and sets Max `<input>` `min` attribute to `constraint.lo`.
- `[ConstraintRow.tsx:handleOffMode]` Sets `mode: "off"`, `lo: 0`, `hi: 0`, `hard: false` while preserving `binId` and `color`.
- `[ConstraintRow.tsx:handleAutoMode]` Sets `mode: "auto"`, `lo: 0`, `hi: null`, `hard: false` while preserving `binId` and `color`.
- `[ConstraintRow.tsx:handleSoftMode]` Sets `mode: "soft"`, `hard: false`, preserving `lo` and `hi` from `"hard"` or `"soft"` modes or defaulting to `lo: 1`, `hi: null`.
- `[ConstraintRow.tsx:handleHardMode]` Sets `mode: "hard"`, `hard: true`, clamping `lo` to `Math.max(1, constraint.lo)` when transitioning from `"hard"` or `"soft"` (otherwise `lo: 1`), and preserving `hi` (otherwise `null`).
- `[ConstraintRow.tsx:handleMinChange]` Ignores `NaN` values; clamps `lo` to `Math.max(0, val)` in `"soft"` mode and `Math.max(1, val)` in `"hard"` mode.
- `[ConstraintRow.tsx:handleMaxChange]` Maps `NaN` values to `null` for `hi`; in `"hard"` mode clamps non-null `hi` to `Math.max(1, hi)`.

## Side effects

- None

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
