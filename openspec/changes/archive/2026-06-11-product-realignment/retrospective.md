# Retrospective: product-realignment

## §0 Evidence

- **Commit Range**: `1280b3a..2175783` — proposal (#138), prune (#139), AGENTS.md consolidation (#140), golden-path wiring + e2e gate (#141).
- **Tasks Completed**: 12/12 checkboxes in `tasks.md`; net diff for the golden-path PR alone was +549/−685 lines.
- **Beads Closed**: 13 beads under `meta:openspec:product-realignment` (epic sm-91dh plus 12 children), plus discovered-from defect sm-49uw fixed in-flight.
- **Test Status**: `bun run lint`, `typecheck`, and `test` green on main; new CI `e2e` job (Playwright golden path) green on first post-fix run.

## §1 Wins

- The golden path now exists end to end: catalog starter bins → `packSpace()` → store selector → canvas render, with a named test at every layer and a pixel-sampling Playwright gate in CI.
- Pruning was net-negative code: solver and engine packages deleted, 8 process specs collapsed into AGENTS.md, and the package DAG is now lint-enforced rather than aspirational.
- Discovered defects were filed as `discovered-from` beads instead of scope-creeping the change (sm-jldz, sm-wjxb, sm-49uw).
- The e2e gate paid for itself immediately: it forced the latent vitest-under-Bun incompatibility into the open before it could bite a future change.

## §2 Misses

- OpenSpec engagement was kickoff-only: flowback happened twice (templatesById, selector naming) but most execution decisions lived solely in beads and commit messages.
- We likely over-invested in planning tooling relative to product: formulas, process specs, and bead taxonomy preceded the first end-to-end user flow by months (user raised this directly; carried in sm-lg32).
- "Golden path" leaked from spec/test vocabulary into product artifact names (`goldenPath.ts`, `GoldenPathSetup.tsx`), confusing the user; a rename decision is still open.
- bd's inconsistent `--json` shapes (create returns an object, close returns an array) broke parsing twice and caused one duplicated bead; blanket "always use --json" guidance also pushes agents into permission-prompt pipes (sm-ng6j).

## §3 Surprises

- Vitest workers crash under the Bun runtime (`[run] bun = true` shims `node` → Bun; zod ESM named exports resolve `undefined`); the incompatibility was invisible until the first unmocked catalog import entered a web test.
- AGENTS.md itself documented a broken command (`bun --cwd packages/<pkg> test`) — agent context files rot like any other docs.
- Local `node_modules` held stale react symlinks (19.2.4 store entries after a 19.2.6 lockfile bump) that `bun install --frozen-lockfile` would not repair; only `--force` rebuilt them.
- The openspec `project_context` still says "Vitest for unit tests" while the agreed direction is Bun-only (sm-4wwn) — generated context blocks need a sync step too.

## §4 Promote

- [ ] sm-lg32 — define the OpenSpec-vs-Beads boundary and pursue spec alignment across all agent tools once this work stabilizes.
- [ ] sm-4wwn — migrate web unit tests from vitest to `bun test` to collapse the runtime matrix (then re-evaluate `[run] bun = true`).
- [ ] sm-ng6j — fix beads integration guidance so interactive agents do not need output-parsing pipes.
- [ ] sm-jldz — derive the BOM panel from the layout selector and delete the dead `packingResultsBySpace` state.
- [ ] Decide whether to rename golden-path product artifacts to domain terms (starter kit) while keeping "golden path" in spec/test names.
