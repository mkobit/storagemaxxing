## Context

`apps/web/src/index.css` defines the `@theme` token vocabulary (color, radius, shadow, motion, font — see `sm-ynun`).
`openspec/specs/web-design-system/spec.md`'s "No new hardcoded color values" scenario already requires components to consume those tokens, but nothing enforces it mechanically today — it relies on code review catching a regression.

A grep of the current tree (verified, not inferred) found the entire remaining surface:

- `apps/web/src/ui/canvas/GridVisualizer.tsx` — four hex literals (`#ccc`, `#666`, `#e0e0e0`, `#999`). Confirmed zero references anywhere under `apps/web` (only match for `rg -l GridVisualizer` is the file's own definition); dead since it was added in #115.
- `apps/web/src/ui/binColorPalette.ts` — six hex literals, a fixed categorical palette (`binColorForIndex`) used to visually distinguish bin instances by index, not to style chrome.
- Five Tailwind arbitrary bracket **literal** values: `ConstraintEditorPanel.tsx:144` (`max-h-[300px]`), `ConstraintEditorPanel.tsx:168` (`max-w-[160px]`), `constraints/ConstraintInputs.tsx:28,39` (`w-[60px]` x2), `constraints/ConstraintRow.tsx:136` (`text-[1.2rem]`).
- Twelve Tailwind arbitrary bracket values across 6 files that reference an actual `@theme` token via `var(...)`, not a literal: `duration-[var(--motion-duration-fast)]` / `ease-[var(--motion-ease-standard)]` in `LayoutCanvas.tsx:176`, `ThemeToggle.tsx:12`, `GoldenPathSetup.tsx:118`, `Toolbar.tsx:47`, `SpaceSwitcher.tsx:5`, `CreateSpaceFormPanel.tsx:10`. **These are legitimate and must stay legal** — Tailwind only auto-generates `duration-*`/`ease-*` utilities from theme keys named `--duration-*`/`--ease-*`, but this repo's motion tokens are namespaced `--motion-duration-*`/`--motion-ease-*` (grouped with the rest of the `--motion-*` vocabulary in `index.css`), so there's no shorthand utility class for them — `-[var(--motion-...)]` is the only way to consume them from Tailwind today. An earlier draft of this design missed this distinction (caught during adversarial review) and would have banned these outright; see Decisions below for the corrected regex.

No other `.ts`/`.tsx` file under `apps/web/src` matched a hex-color pattern or a Tailwind bracket-arbitrary-value pattern at design time (re-verified: `rg -n "\-\[[^\]]+\]" apps/web/src` returns exactly these 17 occurrences across 9 files, no more).

## Goals / Non-Goals

**Goals:**

- Fail `bun run lint` when `apps/web/src/**/*.{ts,tsx}` contains a raw hex/rgb/hsl color literal, so future components can't reintroduce what the last migration removed.
- Fail `bun run lint` when the same files use a Tailwind arbitrary bracket value (`-[...]`), since bypassing Tailwind's built-in scale is the "spacing/shadow" half of the epic's literal-avoidance goal — `index.css` doesn't (and shouldn't) need its own `--spacing-*` namespace when Tailwind's default scale is already token-derived.
- Ship the rule already green: fix the five real bracket-value sites and remove the one dead component that would otherwise fail the new rule on day one.

**Non-Goals:**

- Stylelint / CSS-file linting. `index.css` is where tokens are *defined*; the rule polices *consumption* in components, so it only needs to look at `.ts`/`.tsx`.
- Catching every conceivable arbitrary-value abuse (e.g. `grid-cols-[1fr_2fr]`, which is structural, not styling-token-related). The bracket rule bans literal bracket values but allows `var(--...)`-referencing ones (see Decisions) — it does not otherwise try to distinguish "token-like" from "structural" arbitrary literals. If a future component has a legitimate structural need for a literal bracket value, that's a new decision for that PR to make explicitly (inline `eslint-disable-next-line` with a reason), not something this rule tries to predict.
- Catching Tailwind's built-in named-color utilities (e.g. `bg-red-600`, `text-red-500` in `ConstraintRow.tsx:136`, `LayoutCanvas.tsx:119-121,197`) that bypass the `@theme` token system without using a hex literal or bracket syntax at all. Functionally these are just as non-token-derived as a hardcoded hex value, but banning Tailwind's entire default color palette is a much larger rule (an allowlist of token-derived class name prefixes, not a simple literal-pattern ban) and out of scope for this change. Tracked as a follow-on (`sm-5w9k`, discovered during adversarial review) rather than folded in here.
- Adopting `eslint-plugin-tailwindcss`. Rejected: it resolves Tailwind's JS/PostCSS config format, and has known gaps against Tailwind v4's CSS-first `@theme` config (no JS config file exists in this repo to resolve). A two-rule `no-restricted-syntax` addition is small enough that the plugin's extra surface (a new dependency, a new config-resolution path that might not even work) isn't worth it.
- New Zod schemas or domain objects — this change touches only ESLint config and component source, no runtime data shapes.

## Decisions

**Mechanism: `no-restricted-syntax` with two `Literal`-selector entries, not a hand-authored ESLint rule module.**
The repo already leans on `no-restricted-syntax`/`no-restricted-imports` (configured, not hand-written) for the DAG-boundary rules in `eslint.config.ts`. Two selectors follow the same pattern and need no new rule file, no `RuleTester` harness, and no rule-testing precedent this repo doesn't already have.

Illustrative (pseudocode — regex/selector shape confirmed against real repo strings during design, but the exact ESLint AST selector syntax is not verified and may need adjustment during implementation):

```
"no-restricted-syntax": [
  "error",
  {
    selector: "Literal[value=/#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]",
    message: "Hardcoded color literal -- reference a @theme token in apps/web/src/index.css instead.",
  },
  {
    selector: "JSXAttribute[name.name='className'] Literal[value=/-\\[(?!var\\()[^\\]]+\\]/]",
    message: "Tailwind arbitrary bracket literal -- use a token/scale utility, or a var(--theme-token) reference, or if the value is structural (not styling), disable this rule inline with a reason.",
  },
]
```

The `(?!var\()` negative lookahead exempts `-[var(--...)]` patterns — a bracket value that *references* a `@theme` custom property is the correct token-consuming shape, not a violation; only literal bracket values (`w-[60px]`, `bg-[#3b82f6]`) should be banned. Confirmed against the real repo strings from Context above: the 12 `var(--motion-*)` sites don't match the refined selector, the 5 literal sites do.

Scoped via a new `files: ["apps/web/src/**/*.{ts,tsx}"]` block, `ignores: ["**/*.test.ts", "**/*.test.tsx"]` (existing repo convention — test files aren't held to the same literal-avoidance bar elsewhere in this config either).

**Exempt `binColorPalette.ts` by file path, not by broadening the selector.**
A `files: ["apps/web/src/ui/binColorPalette.ts"]` override block that disables the color rule for that one file, with a comment recording why (categorical data-viz palette, not UI-chrome styling). Keeps the general rule strict everywhere else instead of carving a hole in the regex that could accidentally cover something else later.

**Delete `GridVisualizer.tsx` rather than exempt it.**
Unlike the palette file, there's no ongoing reason to keep dead code around just to carry an exemption. It has zero references; removing it is strictly simpler than exempting it, and leaves nothing for a future reader to wonder about.

**Fix the five bracket-value sites with the closest built-in Tailwind scale step, not new custom tokens.**
`w-[60px]` → `w-15` (Tailwind's default spacing scale: `15 * 0.25rem = 3.75rem = 60px`), `max-h-[300px]` → `max-h-75` (`75 * 0.25rem = 18.75rem = 300px`), `max-w-[160px]` → `max-w-40` (`40 * 0.25rem = 10rem = 160px`), `text-[1.2rem]` → closest step is `text-lg` (1.125rem) or `text-xl` (1.25rem) rather than an exact-pixel match — implementation should pick whichever renders closer and note the (sub-pixel) visual delta, since exact-value preservation isn't the goal, scale-adherence is.
These are pseudocode-level conversions (verify the exact Tailwind v4 default scale step numbers against the installed version during implementation — not re-derived from the lockfile here).

## Data Flow

```
apps/web/src/**/*.{ts,tsx}
        |
        v
  eslint (flat config, apps/web/src file block)
        |
        +--> no-restricted-syntax: Literal hex/rgb/hsl selector ----> ERROR (color literal)
        |
        +--> no-restricted-syntax: className bracket-value selector -> ERROR (arbitrary value)
        |
        v
  bun run lint (CI gate) --- fails the build on either error, same as any other lint rule today
```

No runtime/request data flow exists for this change — it is a static-analysis gate, not a feature with a runtime code path.

## Adversarial Audit

This section was populated, then re-verified by an independent subagent review (`sm-mol-v5r0`) that ran real commands against the repo rather than re-reading the prose. Two findings were real, verifiable blockers and are folded into Context/Decisions above (the `var(--...)` bracket undercount, fixed via the negative-lookahead regex) rather than left here as open risk. What remains below either held up under the independent check or is an accepted, explicitly-scoped gap.

- **False positive: bead-ID-like strings.** Verified the hex regex does *not* match strings like `"sm-2f88"` (no `#` prefix) — safe. Numeric CSS values without `#` (e.g. `rgb(59 130 246)`) are NOT caught by this regex; only `#`-prefixed hex is in scope for the initial rule. `rgb()`/`hsl()` function-call literals are a known gap (see Risks).
- **False positive: `#`-prefixed non-color strings, e.g. PR/issue references in comments (`"PR #228's regression"`).** Independent review confirmed `/#([0-9a-fA-F]{3}|...)\b/.test("issue #123")` → `true` — a 3-digit number after `#` is valid hex and false-positives. No current file under the rule's actual scope (`apps/web/src/**/*.{ts,tsx}`, excluding tests) triggers this today (verified); the one real instance found lives in `apps/web/e2e/catalog-bin-colors.spec.ts`, which is already outside this rule's scope (`apps/web/e2e/**` is globally ESLint-ignored). Accepted as a latent, currently-inert trap: if a future `apps/web/src` comment references a PR/issue number right after `#` with 3, 4, 6, or 8 hex-valid digits, it will false-positive and need an inline disable. Not worth a more complex selector for a gap that hasn't occurred once in the real codebase.
- **False positive: SVG/canvas literal colors that are legitimately outside the token system.** `binColorPalette.ts` is the only real instance found; handled via file-scoped exemption above. If a future component needs a similar categorical (non-chrome) color, it gets the same treatment: a scoped exemption with a comment, reviewed in that PR — not a blanket carve-out now.
- **False negative: computed/dynamic color strings** (e.g. `` `#${dynamicHex}` `` template literals, or a hex string built via string concatenation) won't match a `Literal` selector. Not addressed by this change — no such pattern exists in the repo today (verified via grep), and adding detection for it now would be speculative.
- **False negative: Tailwind's built-in named-color utilities** (`bg-red-600`, `text-red-500`) bypass both rules entirely — no `#`, no brackets, so they're indistinguishable from a token-backed class name by these selectors. Real instances exist today (`ConstraintRow.tsx:136`, `LayoutCanvas.tsx:119-121,197`). Deliberately out of scope; see Non-Goals and follow-on bead `sm-5w9k`.
- **Sync conflict: none.** This is an `apps/web`-only lint config change plus a few component edits; no other in-flight OpenSpec change touches `eslint.config.ts`, `binColorPalette.ts`, `GridVisualizer.tsx`, or the five constraint-editor files (confirmed via `bunx openspec list --json` showing no other active changes at design time, re-confirmed during independent review).
- **Regression risk: `text-[1.2rem]` → scale-step swap changes rendered font size slightly** (1.2rem vs 1.125rem/1.25rem). Low risk — it's a small red delete-button glyph (`ConstraintRow.tsx:136`), not a primary content size; implementation should screenshot-check it isn't visually jarring per the repo's existing UI-change convention (dev server + screenshot before/after).
- **Tailwind v4 spacing-scale arithmetic independently re-verified against the installed package**, not just reasoned from documented defaults: `node_modules/tailwindcss/theme.css` confirms `--spacing: 0.25rem`, so `w-15`=60px, `max-h-75`=300px, `max-w-40`=160px all check out exactly as claimed in Decisions.
- **Bead dependency graph independently re-verified**: `sm-vwdk` DEPENDS ON `sm-sbqr` + `sm-zo8s` (fix-first, rule-second ordering), no inversion of the `bd create --deps blocks:X` gotcha documented in `.beads/PRIME.md`.

## Risks / Trade-offs

- The bracket-value rule bans literal arbitrary values but allows `var(--...)`-referencing ones. Residual risk: a non-token `var(--some-unrelated-css-var)` reference would also slip through uncaught, since the rule can't distinguish a `@theme` token var from any other CSS custom property by name alone. Accepted — no such usage exists in the repo today, and the token vocabulary is small enough that a stray non-token `var()` reference would stand out in review.
- `rgb()`/`hsl()` function-literal colors aren't caught by the initial regex (only `#hex`). Accepted as a known gap since none exist in the repo today — a follow-on bead can extend the selector if/when one shows up, rather than speculatively widening the regex now.
- Tailwind's built-in named-color utilities (`bg-red-600` etc.) aren't caught either, and 3 real instances exist today. Accepted and deferred to `sm-5w9k` rather than expanding this change's scope to an allowlist-based rule.
- Deleting `GridVisualizer.tsx` is small scope creep beyond "add a lint rule," but it's a hard blocker for the rule passing at all, not an unrelated cleanup — called out explicitly in the proposal rather than silently bundled in.
