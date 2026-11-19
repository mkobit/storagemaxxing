# Storybook config (`apps/web/.storybook`)

## Overview

Configures Storybook 10 (`@storybook/react-vite`) story discovery, accessibility checks, CSS imports, and deterministic theme rendering for `apps/web`.

## Interface

- `[main.ts:default]` Exports `config: StorybookConfig` registering `../src/ui/**/*.stories.tsx`, `@storybook/addon-a11y`, `@storybook/react-vite`, and `core: { disableTelemetry: true }`.
- `[preview.tsx:default]` Exports `preview: Preview` importing `../src/index.css`, defining the toolbar `theme` global (`"light" | "dark"` defaulting to `"light"`), and registering `withTheme`.
- `[preview.tsx:withTheme]` `Decorator` supplying a deterministic `ThemeContext.Provider` value and wrapping `<Story />` in `<div className="w-fit min-w-full bg-surface-sunken p-4 text-text-primary">`.

## Invariants

- `[main.ts:default]` Telemetry is disabled (`disableTelemetry: true`) and stories are loaded strictly from `../src/ui/**/*.stories.tsx`.
- `[preview.tsx:withTheme]` Bypasses `ThemeProvider`'s `localStorage` and `matchMedia` lookups so toolbar theme switches deterministically and matches `App.tsx` ambient surface/text tokens for WCAG checks in `apps/web/scripts/check-stories.ts`.
- Typechecked via `apps/web/tsconfig.json` (`".storybook"` in `include`) and ESLint-ignored via root `eslint.config.ts`.

## Side effects

- `[preview.tsx]` Imports `../src/index.css` globally.
- `[preview.tsx:withTheme]` Mutates `document.documentElement.classList` via `classList.toggle("dark", resolvedTheme === "dark")` during render.

## Verification

- Run: `bun run --filter @storagemaxxing/web typecheck`
- Run: `bun run --filter @storagemaxxing/web build-storybook`
