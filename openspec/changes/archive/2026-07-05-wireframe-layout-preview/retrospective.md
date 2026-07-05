# Retrospective: wireframe-layout-preview

## §0 Evidence

- **Commit Range**: `d2e3404..9a29f57` on branch `wireframe-layout-preview` (5 commits, one per bead).
- **Tasks Completed**: 5/5 (`tasks.md` 1.1, 2.1, 2.2, 3.1, 4.1, all checked).
- **Beads Closed**: sm-afiu, sm-5vz0, sm-eo05, sm-a7op, sm-v5cd (`bd query 'label=meta:openspec:wireframe-layout-preview AND status=closed'` returns all 5).
- **Test Status**: `bun run lint`, `bun run typecheck`, `bun test` (102 pass, packages), `bun run --filter @storagemaxxing/web test` (42 pass), `bun run --cwd apps/web test:e2e` (16 pass, including the new `wireframe-toggle.spec.ts`) — all green at the end of each bead and again at the end of the chain.

## §1 Wins

- The bead chain matched the design's dependency order exactly (geometry primitive → scene builder bin faces → scene builder space/ordering/bbox → UI wiring → e2e); no reordering or re-scoping was needed mid-implementation.
- D1–D6 in `design.md` left zero implementation ambiguity for the big architectural calls (projection math, painter ordering, toggle placement, bounding-box-translate-not-scale). The only decisions left to the implementer were small, mechanical ones (exact CSS token names, `Rect2D` reuse for the bounding box, `WireframeScene` wrapper shape) — exactly the kind of judgment call a human wouldn't want to be interrupted for.
- Visual verification in-browser (Playwright script driving the actual dev server, not the webapp-testing skill's Python path) caught nothing wrong, but the exercise was still valuable: it surfaced that the scene renders below the default 720px viewport, which would have been confusing if only judged from unit test coordinates.

## §2 Misses

- First attempt at visual verification used the `webapp-testing` skill's Python/Playwright pattern; the user redirected to the repo's own Bun + `@playwright/test` toolchain, which was both more appropriate (no new Python deps, matches CI) and already fully set up in `apps/web`. Should default to the project's existing test runner before reaching for a skill's generic scripting pattern.
- A full-page screenshot at the default 800×600-ish viewport made the wireframe painting look broken (only a sliver visible) purely because the canvas's intrinsic height (600px) plus its page offset exceeded the viewport height Playwright screenshots by default — not an app bug. Cost a debugging detour (a throwaway `apps/web/scripts/debug-scene.ts` plus a pixel-bbox `page.evaluate`) before landing on "just make the viewport bigger."

## §3 Surprises

- `createSpaceTemplate` lives in `@storagemaxxing/assembly/SpaceTemplate`, not `@storagemaxxing/catalog/bin` — an easy mix-up since both modules deal with "bin"/"space" catalog-adjacent concepts. Cost one red test run (`Export named 'createSpaceTemplate' not found`) before the import was fixed.
- `Rect2D`'s generic `{w, l}` field naming (originally meant for physical width/length) turned out to generalize cleanly to a 2D projected bounding box's `{width, height}` without any awkwardness in the type — existing precedent (`GridVisualizerProps.containerSize.l` used as an SVG viewbox height) confirmed this was already an accepted use of the type, not a stretch.

## §4 Promote

- [x] Default to the project's own test/automation tooling (here: `apps/web`'s `@playwright/test` + `bun run dev`) over a generic skill's scripting pattern when both are available — record as a `feedback` memory.
- [ ] Consider a small note in `apps/web/AGENTS.md` or the Playwright config about canvas elements exceeding the default screenshot viewport, so the next person doesn't repeat the debugging detour.
