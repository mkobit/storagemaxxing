## ADDED Requirements

### Requirement: Component Isolation Rendering

`apps/web` SHALL provide a Storybook instance, scoped to `apps/web` and built with `@storybook/react-vite`, in which components can render in isolation from fixture props/args rather than requiring the full app (store, routing, IndexedDB hydration) to reach a given state.

#### Scenario: Story renders without the app store

- **WHEN** a `*.stories.tsx` file under `apps/web/src/ui/` is loaded in Storybook
- **THEN** the story SHALL render its component using only args/props defined in the story file, with no dependency on `@storagemaxxing/store` or any Zustand hook

#### Scenario: Story reflects real design tokens and theming

- **WHEN** a story renders
- **THEN** it SHALL be styled using the same `apps/web/src/index.css` Tailwind token set (colors, radius, shadow, typography, motion) the real app uses, and SHALL support both the light and dark theme via the same `.dark`-class mechanism `ThemeProvider` uses at runtime

### Requirement: Story Colocation Convention

Story files SHALL be colocated with the component they cover, following the existing `Component.test.tsx` colocation convention already used under `apps/web/src/ui/`.

#### Scenario: Story file location

- **WHEN** a component `Foo.tsx` under `apps/web/src/ui/` gains a story
- **THEN** the story SHALL live at `Foo.stories.tsx` in the same directory as `Foo.tsx`, not in a separate top-level stories directory

### Requirement: Lint and Typecheck Coverage for Story Files

Story files and Storybook configuration SHALL be covered by the project's existing quality gates (`bun run lint`, `bun run typecheck`), not exempted from them.

#### Scenario: Storybook lint rules active on story files

- **WHEN** `bun run lint` runs
- **THEN** `*.stories.tsx` files under `apps/web/src/` SHALL be linted with `eslint-plugin-storybook`'s rules in addition to the project's existing TypeScript/React/functional rule set

#### Scenario: Storybook config included in typecheck

- **WHEN** `bun run typecheck` runs
- **THEN** it SHALL type-check `apps/web/.storybook/**` and any `*.stories.tsx` file under `apps/web/src/`, failing the same way a type error in `apps/web/src/ui/App.tsx` would fail it today

### Requirement: CI Build Verification

A Storybook static build SHALL run as part of CI, so a broken story fails the build the same way a broken app build would.

#### Scenario: CI fails on a broken story

- **WHEN** a story file has a type error, a missing import, or otherwise fails to build
- **THEN** the `verify` job in `.github/workflows/ci.yml` SHALL fail on its Storybook build step

### Requirement: Production Build Exclusion

Storybook tooling, configuration, and story files SHALL NOT be included in the production application build output.

#### Scenario: Production build excludes Storybook

- **WHEN** `bun run --filter @storagemaxxing/web build` runs
- **THEN** the resulting `apps/web/dist/` output SHALL contain no reference to `apps/web/.storybook/` or any `*.stories.tsx` file
