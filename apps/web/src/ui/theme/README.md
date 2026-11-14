# Theme UI

## Overview

Provides React theme state management, `localStorage` persistence, OS color-scheme synchronization, and a toggle button component for light, dark, and system themes.

## Interface

- `[ThemeContext.ts:ThemeContextValue, ThemeContext.ts:ThemeContext]` Exported context value type (`preference`, `resolvedTheme`, `setPreference`) and React context initialized to `null`.
- `[ThemePreference.ts:THEME_STORAGE_KEY]` Exported `localStorage` key constant `"storagemaxxing-theme"`.
- `[ThemePreference.ts:ThemePreferenceSchema, ThemePreference.ts:ThemePreference, ThemePreference.ts:ResolvedTheme]` Exported Zod enum schema (`"light" | "dark" | "system"` with `.catch("system")`) and inferred theme types.
- `[ThemeProvider.tsx:ThemeProvider]` Exported React component providing `ThemeContext`.
- `[ThemeToggle.tsx:ThemeToggle]` Exported React button component that toggles between `"light"` and `"dark"`.
- `[useTheme.ts:useTheme]` Exported hook returning `ThemeContextValue`.
- `[ThemeToggle.stories.tsx:default]` Storybook meta and `Default` story export.

## Invariants

- `[ThemePreference.ts:ThemePreferenceSchema]` Invalid or missing preference values fall back to `"system"` via `.catch("system")`.
- `[useTheme.ts:useTheme]` Throws `"useTheme must be used within a ThemeProvider"` when `ThemeContext` is `null`.
- `[ThemeProvider.tsx:ThemeProvider]` `resolvedTheme` evaluates to `systemTheme` when `preference` is `"system"`, and otherwise equals `preference`.
- `[ThemeToggle.tsx:ThemeToggle]` Computes `nextTheme` as `"light"` when `resolvedTheme` is `"dark"`, and `"dark"` otherwise.

## Side effects

- `[ThemeProvider.tsx:readStoredPreference]` Reads `window.localStorage.getItem(THEME_STORAGE_KEY)` during initial state setup.
- `[ThemeProvider.tsx:ThemeProvider]` Writes `window.localStorage.setItem(THEME_STORAGE_KEY, next)` when `setPreference` is called.
- `[ThemeProvider.tsx:ThemeProvider]` Adds and removes a `"change"` event listener on `window.matchMedia("(prefers-color-scheme: dark)")`.
- `[ThemeProvider.tsx:ThemeProvider]` Toggles the `"dark"` class on `document.documentElement.classList` when `resolvedTheme` changes.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
