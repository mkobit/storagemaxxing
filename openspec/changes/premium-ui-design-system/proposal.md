## Why

The web app currently has almost no design system.
`apps/web/src/index.css` defines exactly three CSS variables (brand primary/secondary/accent) and nothing else — no spacing, radius, shadow, typography, or dark-mode tokens.
Tailwind CSS 4 is wired into the build, but most components (`App.tsx`, `BOMTable.tsx`, `ValidityBadge.tsx`, and others) use ad hoc inline `style={{...}}` objects with hardcoded hex values instead of the token system.
There is no font loading, no dark/light mode mechanism, and no written guideline defining what a "premium" or "Rich Aesthetics" look actually means for this app.
Bead sm-mllt asked for a "premium CSS design system" in one shot, but that bundles authoring a visual language, expanding the token system, loading fonts, building a theme toggle, and migrating ~13 components — too broad and unverifiable as a single unit of work.
This change defines the design system as a spec so the work can be split into independently shippable, individually testable beads.

## What Changes

- Expand the `@theme` token system in `index.css`: color palette (including dark-mode variants), spacing scale, border radius, shadow/elevation, and typography tokens.
- Load and apply the Outfit (headings) and Inter (body) fonts.
- Add a dark/light mode toggle that respects `prefers-color-scheme` by default and persists an explicit user override.
- Define a glassmorphism treatment (translucency, blur, border highlight) for panel-level surfaces (sidebar, BOM panel, constraint editor).
- Define standard transition/motion tokens for interactive state changes (hover, toggle, panel open/close).
- Establish that components MUST consume the token system via Tailwind utility classes rather than inline hardcoded style values, with migration tracked incrementally rather than as a single sweeping rewrite.

## Capabilities

### New Capabilities

- `web-design-system`: defines the token system (color/spacing/radius/shadow/typography), dark/light theming mechanism, font loading, glassmorphism panel treatment, and motion tokens that `apps/web` components must consume.

### Modified Capabilities

(none — `vite-web-foundation`'s existing "Tailwind CSS Integration" requirement is orthogonal build-tooling concern and is unaffected)

## Impact

- Affected package: `apps/web` only (no changes to `packages/geometry`, `catalog`, `assembly`, `packer`, or `store`).
- Affected files: `apps/web/src/index.css`, `apps/web/index.html` (font links), and incrementally each component under `apps/web/src/ui/` as it migrates off inline styles.
- No API or schema changes; purely presentational.
- Follow-on beads (to be created after this design is reviewed) will implement the token expansion, font loading, theme toggle, glassmorphism treatment, and per-component migrations as separate, independently mergeable units.

## Success Criteria

- `openspec/specs/web-design-system/spec.md` exists and defines testable requirements for tokens, theming, fonts, and the glassmorphism/motion treatment.
- The token system is expressed as CSS custom properties in `index.css` and is the single source of truth other specs and beads can reference instead of the vague "Rich Aesthetics" phrase.
- Each follow-on bead has an acceptance criterion runnable as a command (typecheck, unit test, or Playwright screenshot check) per the Bead task contract in `AGENTS.md`.
