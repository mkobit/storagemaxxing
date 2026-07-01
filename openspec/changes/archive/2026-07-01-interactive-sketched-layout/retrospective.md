# Retrospective: interactive-sketched-layout

## §0 Evidence

- **Commit Range**: `b4841b4..17bb5d3` — PRs #170 (design) through #176 (JSON import/export), six implementation PRs (#171–#176) merged to `main`.
- **Tasks Completed**: 6/6 beads (`sm-1oge`, `sm-k6ky`, `sm-kz97`, `sm-wevy`, `sm-1x02`, `sm-o3vo`), plus the design review bead `sm-a70r`.
- **Beads Closed**: 7.
- **Test Status**: `bun run lint`, `bun run typecheck`, `bun run test` (110 pass / 0 fail across packages + apps/web), and `bun run --cwd apps/web test:e2e` (8 pass) all green on `main` after the final merge.
- **Net Diff**: `packages/store` gained `updateConstraintInState`/`removeConstraintFromState` helpers, a `loadSketch` action, and a new `SketchSerialization.ts` (Zod `Sketch` schema + `serializeSketch`/`parseSketch`/`toSketch`); `apps/web` gained `ConstraintEditorPanel` (constraint list + catalog bin picker with search), `ConstraintRow`/`ConstraintInputs` (mode dropdown, min/max editing), and Toolbar Export/Import buttons wired to a hidden file input; five new e2e scenarios (mode-refresh, partial/non-valid/unresolved badges, reload persistence, export→import round trip) were added to `golden-path.spec.ts`.

## §1 Wins

- The six tasks decomposed cleanly along the store→UI seam: store actions (`sm-1oge`) landed before the UI that calls them (`sm-k6ky`, `sm-kz97`, `sm-wevy`), so no task blocked on unmerged sibling work.
- Two tasks (`sm-wevy`, `sm-1x02`) turned out to already be functionally implemented by earlier work — the mode dropdown and store wiring shipped as part of `sm-k6ky`, and IndexedDB persistence had existed since the Spatial Foundations Slice, long before this change was proposed. Closing them required only tests proving the acceptance criteria, not new product code — cheaper than assumed, but only found by reading the existing implementation before writing new code.
- Session resumption (picking up a stalled prior session on `sm-kz97`) worked because the branch was already committed and pushed; the only missing step was `gh pr create`. Checking `gh pr list --head <branch>` before redoing any work avoided wasted effort.
- The e2e suite's poll-based assertion style (already established for canvas pixel sampling) extended naturally to a new use: polling IndexedDB directly via `page.evaluate` to avoid a race between the async `zustand/persist` write and `page.reload()`, instead of a fixed sleep.

## §2 Misses

- `sm-1oge` and `sm-k6ky` were closed in `bd` in a prior session but their `tasks.md` checkboxes were never flowed back — caught only when this session cross-checked bd state against the OpenSpec task list before starting new work. The flowback step is easy to skip mid-session and there's no automated check catching the drift.
- The `sm-1x02` bead title ("LocalStorage sketch persistence") doesn't match what was actually built or specified — the `local-persistence` spec explicitly calls for IndexedDB. The stale title could mislead a future reader into thinking `localStorage` is used; the spec is the source of truth but the bead metadata should have been corrected instead of left to drift.

## §3 Surprises

- No `modern-web-guidance` entry exists for Blob-based file download or `<input type="file">` handling — these are old, stable Baseline APIs, so the skill's "must trigger" rule for local-filesystem-access surfaced a search with only low-similarity, irrelevant matches rather than a directly applicable guide. Confirms the skill is tuned for newer/contested APIs, not settled ones.
- Playwright's `browser.newContext()` was necessary (not just `context.newPage()`) to get a genuinely empty IndexedDB for the import test — a same-context new page still shares storage with the page that ran the export, which would have silently made the import assertion pass for the wrong reason (persisted state, not the imported file).

## §4 Promote

- [ ] Add a lightweight periodic check (or a `bd lint`-style rule) that flags beads closed in `bd` whose corresponding `tasks.md` checkbox is still unchecked, so flowback gaps like `sm-1oge`/`sm-k6ky` are caught automatically instead of by manual cross-check.
- [ ] When a bead's title is discovered to be stale relative to its spec (as with `sm-1x02`), update the bead title/description at close time rather than only noting it in the close reason.
