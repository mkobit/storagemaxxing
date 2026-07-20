## MODIFIED Requirements

### Requirement: Design Token System

`apps/web/src/index.css` SHALL define a `@theme` token vocabulary covering color (including dark-mode variants), spacing, border radius, shadow/elevation, typography, and motion, so components have a single source of truth instead of hardcoded values.
Violations of the "no new hardcoded literal" rule SHALL be caught mechanically by `bun run lint`, not rely solely on code review.

#### Scenario: Token-derived utility class

- **WHEN** a component uses a Tailwind utility class backed by a design token (e.g. `bg-surface-panel`, `rounded-lg`, `shadow-glass`)
- **THEN** the compiled CSS bundle SHALL include the corresponding value from the `@theme` token declared in `index.css`

#### Scenario: No new hardcoded color values

- **WHEN** a component migrated under this design system needs a color, radius, shadow, or spacing value
- **THEN** it SHALL reference an existing `@theme` token rather than introducing a new hardcoded literal

#### Scenario: Lint fails on a new hardcoded color literal

- **WHEN** a component under `apps/web/src` introduces a new hex, rgb, or hsl color literal outside `index.css`
- **THEN** `bun run lint` SHALL fail with a rule violation pointing at the design-token system, except for files under an explicit, reviewed exemption (e.g. `binColorPalette.ts`, a categorical data-visualization palette rather than UI-chrome styling)

#### Scenario: Lint fails on a new Tailwind arbitrary bracket value

- **WHEN** a component under `apps/web/src` introduces a new Tailwind arbitrary bracket value (`-[...]`) in a `className`
- **THEN** `bun run lint` SHALL fail with a rule violation pointing at the design-token system, unless the violation is explicitly suppressed inline with a reason for a structural (non-styling) use
