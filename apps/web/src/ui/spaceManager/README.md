# Space manager UI

## Overview

Provides React UI components, a Zod input schema, and Storybook stories for creating and switching storage spaces backed by the Zustand store.

## Interface

- `[CreateSpaceForm.ts:CreateSpaceInputSchema]` Zod schema validating `name`, `system`, `columns`, `rows`, and `depth`.
- `[CreateSpaceDialog.tsx:CreateSpaceDialogProps]` Props interface `{ readonly isOpen: boolean; readonly onClose: () => void }`.
- `[CreateSpaceDialog.tsx:CreateSpaceDialog]` `React.FC<CreateSpaceDialogProps>` modal dialog for creating a new space and template.
- `[CreateSpaceFormPanel.tsx:CreateSpaceFormPanelProps]` Props interface `{ readonly defaultOpen?: boolean }`.
- `[CreateSpaceFormPanel.tsx:CreateSpaceFormPanel]` `React.FC<CreateSpaceFormPanelProps>` rendering the `'+ New space'` trigger button and `CreateSpaceDialog` (`defaultOpen = false`).
- `[SpaceSwitcher.tsx:SpaceSwitcherProps]` Props interface `{ readonly defaultOpen?: boolean }`.
- `[SpaceSwitcher.tsx:SpaceSwitcher]` `React.FC<SpaceSwitcherProps>` dropdown listbox for selecting `activeSpaceId` from store spaces (`defaultOpen = false`).
- `[SpaceManager.tsx:SpaceManager]` `React.FC` rendering `CreateSpaceFormPanel` and `SpaceSwitcher` together.
- `[CreateSpaceFormPanel.stories.tsx]` Storybook stories `Blank`, `FilledValid`, `ValidationErrorEmpty`, and `ValidationErrorInvalidNumber` for `CreateSpaceFormPanel`.
- `[SpaceManager.stories.tsx]` Storybook stories `Empty`, `SingleSpace`, and `MultipleSpaces` for `SpaceManager`.
- `[SpaceSwitcher.stories.tsx]` Storybook stories `Empty`, `SingleSpace`, `MultipleSpaces`, and `DropdownOpen` for `SpaceSwitcher`.

## Invariants

- `[CreateSpaceForm.ts:CreateSpaceInputSchema]` Requires `name` min length 1, `system` matching `StorageSystemSchema`, positive integer coerced `columns` and `rows`, and positive coerced `depth`.
- `[CreateSpaceDialog.tsx:CreateSpaceDialog]` Renders `null` when `isOpen` is `false`; defaults `system` to `'gridfinity'`, creates templates with accessFace `'top'`, and parses space instances with `count: 1` and `constraints: {}` via `SpaceInstanceSchema.parse`.
- `[SpaceSwitcher.tsx:SpaceSwitcher]` Renders `'No spaces yet'` when `spaces.length === 0`; falls back to `spaces[0]` when `activeSpaceId` is not found in `spaces`.

## Side effects

- `[CreateSpaceDialog.tsx:CreateSpaceDialog]` Attaches and cleans up a `window` `'keydown'` listener for `Escape` when `isOpen` is `true`; on valid submit calls `crypto.randomUUID()` and mutates store state via `addTemplate`, `addSpace`, and `setActiveSpace`.
- `[SpaceSwitcher.tsx:SpaceSwitcher]` Attaches and cleans up `window` `'keydown'` (`Escape`) and `'mousedown'` (outside `containerRef`) listeners when `isOpen` is `true`; item click mutates store state via `setActiveSpace`.
- `[CreateSpaceFormPanel.stories.tsx:meta]` Mutates Zustand store via `useStore.setState` in Storybook decorator.
- `[SpaceManager.stories.tsx, SpaceSwitcher.stories.tsx]` Mutate Zustand store via `useStore.setState` in Storybook decorators.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
