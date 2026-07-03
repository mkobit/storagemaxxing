# web-design-system Specification

## Purpose
TBD - created by archiving change premium-ui-design-system. Update Purpose after archive.
## Requirements
### Requirement: Design Token System

`apps/web/src/index.css` SHALL define a `@theme` token vocabulary covering color (including dark-mode variants), spacing, border radius, shadow/elevation, typography, and motion, so components have a single source of truth instead of hardcoded values.

#### Scenario: Token-derived utility class

- **WHEN** a component uses a Tailwind utility class backed by a design token (e.g. `bg-surface-panel`, `rounded-lg`, `shadow-glass`)
- **THEN** the compiled CSS bundle SHALL include the corresponding value from the `@theme` token declared in `index.css`

#### Scenario: No new hardcoded color values

- **WHEN** a component migrated under this design system needs a color, radius, shadow, or spacing value
- **THEN** it SHALL reference an existing `@theme` token rather than introducing a new hardcoded literal

### Requirement: Dark and Light Theming

The application SHALL support a dark and a light theme, defaulting to the operating system's `prefers-color-scheme`, with an explicit user override that persists across page reloads.

#### Scenario: Default follows OS preference

- **WHEN** no theme override has been stored and the OS reports `prefers-color-scheme: dark`
- **THEN** the application SHALL render in the dark theme

#### Scenario: Explicit override persists

- **WHEN** a user toggles the theme to an explicit value (light or dark)
- **THEN** that value SHALL be persisted and SHALL be applied on the next page load regardless of the current OS preference

#### Scenario: Corrupted stored preference degrades safely

- **WHEN** the stored theme preference value is missing, malformed, or not one of `"light" | "dark" | "system"`
- **THEN** the application SHALL fall back to `"system"` behavior rather than throwing an error or failing to render

### Requirement: Typography

The application SHALL load and apply the Outfit font for headings and the Inter font for body text, with a system-font fallback that renders immediately while the custom fonts load.

#### Scenario: Fonts applied

- **WHEN** the application renders a heading or body text element
- **THEN** it SHALL use the `--font-heading` (Outfit) or `--font-body` (Inter) token respectively

#### Scenario: No render blocking

- **WHEN** the custom fonts have not yet finished loading
- **THEN** text SHALL still be visible using a fallback font (`font-display: swap` or equivalent), rather than being invisible until the custom font loads

### Requirement: Glassmorphism Panel Treatment

Panel-level chrome surfaces (sidebar, BOM panel, constraint editor panel) SHALL use a glassmorphism treatment (translucent background, backdrop blur, subtle border highlight) defined by shared tokens, while frequently-repainted surfaces (the layout canvas) SHALL be excluded from backdrop-filter blur.

#### Scenario: Panel surface styling

- **WHEN** a designated panel component (sidebar, BOM panel, or constraint editor panel) renders
- **THEN** it SHALL apply the shared glass panel treatment (background token + `backdrop-filter` blur + border highlight)

#### Scenario: Canvas excluded from blur

- **WHEN** the `LayoutCanvas` SVG visualization renders or updates
- **THEN** it SHALL NOT have `backdrop-filter` applied to it or its ancestors

### Requirement: Motion Tokens

Interactive state changes (hover, theme toggle, panel open/close) SHALL use shared transition duration and easing tokens rather than one-off per-component values.

#### Scenario: Consistent transition timing

- **WHEN** a component defines a CSS transition for an interactive state change
- **THEN** it SHALL reference the shared `--motion-duration-*` and `--motion-ease-*` tokens instead of an inline literal duration/easing value

