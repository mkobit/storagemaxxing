## Why

`apps/web/src/index.css` defines a `@theme` token vocabulary (color, radius, shadow, motion) that the "No new hardcoded color values" scenario in `openspec/specs/web-design-system/spec.md` requires components to consume instead of hardcoded literals.
That requirement is currently unenforced by tooling — nothing fails `bun run lint` when a component reaches for a raw hex color or an arbitrary Tailwind bracket value instead of a token.
The epic (sm-2f88) deferred this until the component migration beads (sm-vj3p, sm-4gqq, sm-xwtr) landed, since most components used inline hex before then and turning the rule on earlier would have failed the build on pre-existing usage.
All three have shipped, so the rule can go on now.

A grep of the current `apps/web/src` tree found only four leftover literal sites: a dead, zero-reference component (`GridVisualizer.tsx`, unused since it was added in #115) with four hex colors, an intentional categorical color palette (`binColorPalette.ts`) used to visually distinguish bin instances rather than to style UI chrome, and five Tailwind arbitrary bracket values (`w-[60px]` x2, `max-h-[300px]`, `max-w-[160px]`, `text-[1.2rem]`) in constraint-editor components.
This is a small, enumerable surface, which is what makes turning the rule on now tractable.

## What Changes

- Add two ESLint rule entries (built on `no-restricted-syntax`, no new plugin dependency) scoped to `apps/web/src/**/*.{ts,tsx}` in `eslint.config.ts`:
  - **No hardcoded color literal**: bans string literals matching a hex-color pattern (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`) anywhere in `.ts`/`.tsx` source. This catches raw hex both in JSX/SVG attributes (`fill="#e0e0e0"`) and in inline `style={{}}` object values, which is the shape of every current offender.
  - **No arbitrary Tailwind bracket value**: bans Tailwind's `-[...]` arbitrary-value syntax inside `className` string literals. Tailwind's default scale (spacing, sizing, typography) is itself token-derived, so bypassing it with a bracket literal defeats the same consistency goal as a hardcoded hex value — this is what "no hardcoded spacing/shadow literal" cashes out to in practice, since `index.css` does not (and does not need to) define a separate `--spacing-*` namespace.
- Exempt `apps/web/src/ui/binColorPalette.ts` from the color rule via a file-scoped ESLint override, with a comment explaining why: it is a qualitative, index-driven palette for telling bin instances apart in a layout, not a UI-chrome styling choice — conceptually closer to a chart color scale than to the design-token system.
- Delete `apps/web/src/ui/canvas/GridVisualizer.tsx`: confirmed zero references anywhere in `apps/web` (`rg -l GridVisualizer` matches only its own file) since it was added in #115. It is the only other source of pre-existing hex literals, and leaving it in place would fail `bun run lint` the moment the new rule is enabled, for a component nothing renders.
- Fix the five real arbitrary-bracket-value sites in `ConstraintEditorPanel.tsx` and `constraints/{ConstraintInputs,ConstraintRow}.tsx` by replacing them with the closest built-in Tailwind scale utility (e.g. `w-[60px]` → `w-15`, `max-h-[300px]` → `max-h-75`) so the codebase passes with the new rule from the start.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `web-design-system`: the existing "No new hardcoded color values" requirement gains a new scenario stating that violations are caught by `bun run lint`, not just code review.

## Impact

- Affected packages: `apps/web` only (ESLint config + a handful of component files). No changes to `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer`, or `packages/store`.
- Not a new dependency: implemented with ESLint's built-in `no-restricted-syntax`, not a third-party Tailwind lint plugin. `eslint-plugin-tailwindcss` was considered and rejected — it targets Tailwind's JS/PostCSS config format and has known gaps with Tailwind v4's CSS-first `@theme` config, which this repo uses exclusively.
- `bun run lint` will fail repo-wide until the five real bracket-value sites are fixed and `GridVisualizer.tsx` is removed — both are included in this change so the rule ships already green.

## Success Criteria

- `bun run lint` fails when a component under `apps/web` introduces a new hex/rgb/hsl color literal or a new Tailwind arbitrary bracket value, with a message pointing at the design-token system.
- `bun run lint` passes on the current `apps/web` tree once `GridVisualizer.tsx` is removed and the five arbitrary-bracket-value sites are converted to scale utilities.
- `binColorPalette.ts` continues to pass lint unchanged, via its documented, scoped exemption.
- No changes to `packages/*` — this is a `web`-only lint change.
