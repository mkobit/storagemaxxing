# Retrospective: layout-fit-to-viewport

## §0 Evidence

- **Branches**: proposal on `task/sm-xlho-fit-to-viewport-proposal` (PR #204, merged); implementation on `task/sm-xlho-fit-to-viewport-impl`.
- **Tasks Completed**: 5/5 beads (`sm-xlho.1`–`sm-xlho.5`), plus the parent task `sm-xlho`.
- **Beads Closed**: 6. Two follow-up bugs filed: `sm-65ad` (P1, packSpace NaN-origin placements — discovered-from `sm-xlho`) and referenced but not re-filed `sm-tdrm`/`sm-h2kv` from the sibling `sm-csu4` change.
- **Test Status**: `bun run lint`, `bun run typecheck`, `bun test` (156 pass / 0 fail across root + `apps/web`), and `bun run --cwd apps/web test:e2e` (16 pass) all green.
- **Net Diff**: new `apps/web/src/ui/viewportFit.ts` (`computeViewportFit`, `computeLayoutBounds`) with 12 unit tests; `apps/web/src/ui/LayoutCanvas.tsx` rewired — both `drawSpaceBounds`/`drawPackedLayout` (2D) and `paintWireframe` (wireframe) now share one fit computation via a bundled `LayoutTransform`; `PIXELS_PER_INCH` and `WIREFRAME_MARGIN_PX` fully removed; two e2e tests (`golden-path.spec.ts`, `space-manager.spec.ts`) fixed after their pixel assertions broke against the new dynamic scale.

## §1 Wins

- The Fable scoping agent for this change completed the full artifact set (proposal, design with D1–D7, specs delta, tasks) in one pass this time — a clean contrast to the sibling `sm-csu4` change's Fable crash. Reviewing it required almost no rewrite; the design's exact formulas (`scale = min(...)`, `offsetX = (viewport.w - bbox.w·scale) / 2`) transferred directly into working code.
- D3's uniform-scale decision (reject per-axis stretch) paid off immediately and measurably: the space-manager e2e tests confirmed aspect ratio is preserved to within floating-point/stroke-width noise (5:4, 1:1, 3:1 all held) on the very first run after the rewire.
- The `max-params` ESLint rule forced the same "bundle into a small typed object" pattern this change needed independently of `sm-csu4` (`LayoutTransform` here, `PackingContext`/`HeightEligibility` there) — reinforces that this is now the house style for a function outgrowing 4 params, not a one-off workaround.
- D7's "no new Zod schema" call, justified by precedent (`PackingResult`, `LayoutResolution`, `ObliqueProjection`), held with zero friction — no reviewer or test pushed back on `ViewportFit` being a plain TS type.

## §2 Misses

- The design's Risk section claimed "existing e2e asserts testids, visibility, and badge text — not pixels — so no assertions should break." This was wrong for two tests that directly asserted pixel positions/sizes tied to the legacy fixed `PIXELS_PER_INCH = 24` density. Both broke immediately on the 2D-path rewire. Caught by actually running the e2e suite before closing the task, not by the design's own risk analysis — the same category of miss as `sm-csu4`'s `generateAutoFillRects` assumption, suggesting design.md Risk sections should be validated against a real test run before being written as confident claims, not just reasoned about from reading test names.
- A significant chunk of implementation time went into chasing a manual visual-verification artifact (a blank canvas) that turned out to be two compounding causes: (1) my own tooling mistake reusing the `add-starter-bins` fixture against the wrong active space, and (2) a genuine pre-existing `packSpace` bug (`sm-65ad`) that only became visible because the new fit-to-viewport math unions all placement coordinates into one shared bounding box, so a single NaN placement now poisons the whole render instead of failing silently per-bin. The design's Adversarial Audit covered degenerate (zero-extent) bounding boxes but not NaN-poisoned inputs from malformed upstream data — a blind spot worth generalizing: "defined behavior for degenerate geometric inputs" should include non-finite values, not just zero.
- Manual screenshot verification hit the exact `canvas`-exceeds-viewport crop gotcha already documented in `apps/web/AGENTS.md` (from `sm-8khu`, this same session) — confirms that note is worth having, but I still had to rediscover it live rather than checking the doc first.

## §3 Surprises

- The `bd create --deps blocks:` direction bug (see `sm-csu4`'s retrospective, `sm-h2kv`) recurred identically for this change's 5-task chain and was caught the same way (a `bd ready` sanity check before marking anything `status:needs-review`) — confirms this is a systemic gotcha worth fixing upstream rather than a one-off mistake.
- Catalog-added bin constraints (via the generic "+Add" button, not the golden-path fixture's per-index color assignment) default to `color: "#000000"`. Combined with an unconstrained (`max: none`) autofill densely tiling a large space, this produces a visually confusing "solid black rectangle" that looks like a rendering bug but is actually correct behavior with an unfortunate default color choice — cost real debugging time before being ruled out as unrelated to this change.
- Playwright's `locator("canvas").screenshot()` (element screenshot) does not suffer the viewport-crop gotcha the way a full-page `page.screenshot()` does when the canvas sits below the fold — worth adding to the `apps/web/AGENTS.md` note as a third mitigation alongside `fullPage: true` and a taller viewport.

## §4 Promote

- [ ] Fix `sm-65ad` (packSpace NaN-origin placements) — P1, actively degrades the product's "invalid pack still shows you something" promise in both render modes today, not just a latent risk.
- [ ] Apply the same non-finite-input hardening this change added to `computeLayoutBounds` to `wireframeScene.ts`'s `computeBoundingBox` — currently has the identical vulnerability, flagged but not fixed (out of scope for this change's design).
- [ ] Add "use element screenshots (`locator.screenshot()`) for canvas verification, not just `fullPage: true`" to the `apps/web/AGENTS.md` canvas/viewport note from `sm-8khu`.
- [ ] Design.md Risk sections should be checked against an actual test run (not just reasoned from test names) before being written with confident claims like "no assertions should break" — recurring miss across both `sm-csu4` and this change.
