# Retrospective: drawer-space-manager

## §0 Evidence

- **Commit Range**: `main..sm-5po5-space-manager` (5 commits, a69b682..8e396f8)
- **Tasks Completed**: 5/5 (`tasks.md` 1.1, 2.1, 2.2, 3.1, 4.1), plus parent `sm-5po5`
- **Beads Closed**: sm-yl17, sm-ejk6, sm-i6tg, sm-4w8h, sm-k81y, sm-5po5
- **Test Status**: `bun test` (apps/web, 34 tests) pass; `bun test` across geometry/catalog/assembly/packer/store (99 tests) pass; `bun run --cwd apps/web test:e2e` (15 tests, including 2 new in `space-manager.spec.ts`) pass; `bun run typecheck` and `bun run lint` clean.

## §1 Wins

- Design.md's exact code block for `CreateSpaceInputSchema` and its file path (`apps/web/src/ui/spaceManager/CreateSpaceForm.ts`) meant sm-yl17 needed zero design decisions during implementation — copy the schema, write the tests, done.
- Task dependency graph (sm-yl17/sm-ejk6 unblocked, sm-i6tg/sm-4w8h/sm-k81y gated) matched the natural build order exactly; no task had to be reordered or reworked because a dependency turned out wrong.
- The Adversarial Audit in design.md ("invalid input must not partially add a template without a matching space") translated directly into a test case (blank-name / non-numeric-rows submissions assert zero store mutations), catching the exact failure mode it was written to prevent.
- Reusing `createSpaceTemplate`/`SpaceInstanceSchema`/existing store actions unchanged meant the entire change stayed in `apps/web` — no package DAG changes, no cross-package coordination.

## §2 Misses

- Design.md's data flow diagram shows a single `id` reused for both `createSpaceTemplate(id, ...)` and `SpaceInstanceSchema.parse({ id, templateId, ... })`, which reads as if template id and space id should be the same value. Implementation used two separate `crypto.randomUUID()` calls (matching `GoldenPathSetup`'s existing pattern of distinct ids), which is correct but required inferring past the diagram's ambiguity rather than following it literally.
- The parent bead's acceptance criterion ("active canvas updates to a 5x4 grid") doesn't specify what "grid" means at the rendering layer — `LayoutCanvas` draws a single dashed bounding rectangle, not a cell grid. The e2e test had to reverse-engineer this via `LayoutCanvas.tsx`'s `drawSpaceBounds` and pixel-scan the canvas for the stroke color's bounding box, which is more fragile than a semantic assertion would be.

## §3 Surprises

- `tasks.md` carries a header comment claiming it's a "generated snapshot" regenerable from bd state, but no `bd`/`openspec` command actually performs that regeneration (`openspec-sync` only hydrates bd from OpenSpec, not the reverse) — checkboxes were updated by hand to close the loop.
- The pixel-based canvas bounds check (borrowed from `golden-path.spec.ts`'s color-scan pattern for filled bins) worked cleanly for stroked/dashed rectangles too, with no anti-aliasing flakiness across two separate spec runs.

## §4 Promote

- [ ] Add a one-line note to `design.md`'s data-flow diagram clarifying that template id and space id are independently generated, to remove the ambiguity noted in §2.
- [ ] File a meta bead for the missing tasks.md-regeneration tooling (see reflection.md).
