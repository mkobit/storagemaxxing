## Context

`apps/web/src/index.css` currently defines three tokens only (`--color-brand-primary`, `--color-brand-secondary`, `--color-brand-accent`) via Tailwind 4's `@theme` directive.
No spacing, radius, shadow, typography, or dark-mode tokens exist.
No fonts are loaded (`apps/web/index.html` has no font links).
No theme toggle, `ThemeContext`, or `prefers-color-scheme` handling exists anywhere in `apps/web`.
Most components (`App.tsx`, `BOMTable.tsx`, `ValidityBadge.tsx`, etc.) use inline `style={{...}}` objects with hardcoded hex values instead of Tailwind utility classes.
The domain store (`packages/store/src/useStore.ts`) already persists sketch state to IndexedDB via `idb-keyval` under the key `storagemaxxing-db` — this is domain state (spaces, constraints, bins) and is out of scope for a UI-only theme preference.

## Goals / Non-Goals

**Goals:**

- Define a complete design token vocabulary (color incl. dark variants, spacing, radius, shadow, typography, motion) as CSS custom properties in `index.css`.
- Define a dark/light theme mechanism: default to `prefers-color-scheme`, allow an explicit user override, persist the override.
- Define font loading for Outfit (headings) and Inter (body).
- Define a glassmorphism visual treatment for panel-level surfaces (sidebar, BOM panel, constraint editor).
- Define motion tokens for transitions (hover, toggle, panel open/close).
- Make the token system the thing components are expected to consume, and let migration of existing inline-styled components happen incrementally, one bead at a time, rather than as a single rewrite.

**Non-Goals:**

- Rewriting every existing component's styling in this change. This design defines the system; follow-on beads migrate individual components.
- Any change to `packages/geometry`, `catalog`, `assembly`, `packer`, or `store` — this is `apps/web`-only.
- Full WCAG audit or accessibility overhaul — contrast is a constraint on the token values chosen, not a separate workstream here.
- Component library / Storybook adoption (tracked separately as sm-8ywp, deferred).

## Decisions

### Token structure

Expand the existing `@theme` block in `index.css` with namespaced tokens Tailwind 4 will generate utilities for:

- `--color-surface-*`, `--color-text-*`, `--color-border-*` — light values by default, dark values re-declared under a `.dark` class selector (class-based dark mode, not only `prefers-color-scheme`, so the explicit override can win).
- `--spacing-*` (already partially covered by Tailwind defaults; only add overrides if the default scale is insufficient).
- `--radius-*` (sm/md/lg/full) for the "premium" rounded-corner language.
- `--shadow-*` including a `--shadow-glass` used by the glassmorphism treatment.
- `--font-heading` (Outfit) and `--font-body` (Inter).
- `--motion-duration-*` and `--motion-ease-*` for transitions.

### Theme toggle & persistence

The theme preference (`"light" | "dark" | "system"`) is a UI concern, not domain state, so it does NOT go through `packages/store`'s IndexedDB-backed Zustand store.
Instead: a small `ThemeProvider` in `apps/web/src/ui/theme/` reads/writes a dedicated `localStorage` key (`storagemaxxing-theme`), separate from the `storagemaxxing-db` domain key, and toggles a `.dark` class on `<html>`.
The persisted value is validated with a Zod schema on read so a corrupted/foreign localStorage value can't put the app in a broken state:

```ts
const ThemePreferenceSchema = z.enum(["light", "dark", "system"]).catch("system");
```

`.catch("system")` makes invalid/missing values fall back to `"system"` rather than throwing, since a corrupted UI preference should never block the app from rendering.

### Glassmorphism treatment

Panel surfaces use `backdrop-filter: blur(...)` + semi-transparent background + a subtle top-highlight border, expressed as a Tailwind utility combo or a small `.glass-panel` class backed by the new shadow/color tokens. Applied first to the existing sidebar/BOM/constraint panels identified in the current component survey.

### Migration strategy

Each follow-on bead migrates one component group (e.g., BOM panel, constraint editor panel, toolbar/canvas) from inline `style={{...}}` to token-driven Tailwind classes, verified by a Playwright screenshot diff or a visual smoke check. This keeps each bead's diff small and independently revertable instead of one large cross-cutting rewrite.

## Data Flow

```
                 ┌────────────────────────┐
                 │  OS setting              │
                 │  prefers-color-scheme    │
                 └───────────┬──────────────┘
                             │ (default, if no override)
                             ▼
┌──────────────┐    read/write    ┌──────────────────────┐
│ localStorage  │◄────────────────►│   ThemeProvider        │
│ "storagemaxxing-theme" │         │ (apps/web/src/ui/theme)│
└──────────────┘                  └───────────┬────────────┘
        ▲  validated via                       │ sets .dark class
        │  ThemePreferenceSchema.catch("system")│ on <html>
        │                                       ▼
        │                          ┌─────────────────────────┐
        └──────────────────────────│  index.css @theme tokens │
                                    │  (light vals / .dark     │
                                    │   overrides)              │
                                    └───────────┬───────────────┘
                                                │ consumed by
                                                ▼
                                    ┌─────────────────────────┐
                                    │  apps/web/src/ui/*        │
                                    │  components (Tailwind     │
                                    │  utility classes)          │
                                    └─────────────────────────┘
```

## Adversarial Audit

- **FOUC (flash of unstyled/wrong theme)**: if the `.dark` class is applied only after React hydrates, a `dark`-preferring user briefly sees the light theme. Mitigation: inline a tiny blocking script in `index.html` `<head>` that reads `localStorage` and sets the class before first paint — this is the one exception to "no manual DOM scripting," since it's unavoidable for FOUC prevention and ships in every SPA that supports dark mode.
- **Override vs. OS conflict**: if `prefers-color-scheme` changes while an explicit override is stored, the explicit override MUST win — the `ThemePreferenceSchema` distinguishes `"system"` (follow OS) from an explicit `"light"`/`"dark"` (pinned), so this is a schema-level guarantee, not an ad hoc check.
- **Corrupted/foreign localStorage value**: another origin-adjacent app or a manual edit could put an arbitrary string in `storagemaxxing-theme`. The `.catch("system")` on the Zod schema ensures this degrades to system default instead of crashing the app.
- **Glassmorphism contrast failure**: `backdrop-filter: blur` over busy canvas content (the SVG packing visualization) can reduce text contrast below readable levels. Mitigation: the `--shadow-glass` panel background token must specify a minimum opacity floor (not fully transparent) chosen for contrast, verified visually per-bead rather than assumed.
- **Concurrent edits to `index.css`**: multiple follow-on beads touching the same `@theme` block risk merge conflicts if worked in parallel. Mitigation: the token-expansion bead lands first and is a hard dependency for every other bead in `tasks.md` — no parallel editing of `index.css` until the base token set exists.
- **Font loading blocking render**: remote font requests (Google Fonts or self-hosted) can delay first paint. Mitigation: use `font-display: swap` and preconnect hints so text renders in a fallback font immediately and swaps in Outfit/Inter without blocking.
- **Migration inconsistency window**: while components migrate one at a time, the app will temporarily look "half-migrated" (some panels styled, others not). This is an accepted trade-off per the Non-Goals — it is visible only in-progress, not in any single merged bead's final state.

## Risks / Trade-offs

- Class-based dark mode (vs. pure `prefers-color-scheme` media query) adds the small inline FOUC-prevention script as a deliberate, documented exception to normal component-only rendering.
- `backdrop-filter` has a performance cost on lower-end devices when applied to frequently-repainted surfaces; the design restricts it to static panel chrome (sidebar/BOM/constraint panels), not the frequently-updating `LayoutCanvas` SVG.
- Incremental per-component migration means the design token system and the "old" inline-style approach coexist for a while; this is intentional (small, revertable beads) but means `AGENTS.md` compliance ("components consume tokens") isn't fully true until the last migration bead lands.
