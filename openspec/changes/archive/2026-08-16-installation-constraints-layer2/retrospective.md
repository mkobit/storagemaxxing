# Retrospective: installation-constraints-layer2

## §0 Evidence

- **Commit Range**: `main..installation-constraints-layer2` (4 commits: `0e92503`, `d517fe1`, `3ba634c`, `1828308`)
- **Tasks Completed**: 4/4 (catalog `weightLbs`, assembly `WeightOverflowFailure`, store `resolveSpace` filtering/aggregation, web constraint editor controls)
- **Beads Closed**: sm-mol-mcwo.3, sm-mol-mcwo.4, sm-mol-mcwo.5, sm-mol-mcwo.6 (parent `sm-mol-mcwo` and root `sm-mol-439v` auto-closed)
- **Test Status**: `bun test` (root) 168/168 pass, `bun run --cwd apps/web test` 86/86 pass, `bun run typecheck` clean, `bun run lint` clean. Verified `apps/web` visually via `bun run screenshot --recipe=constraint-row`.

## §1 Wins

- Reused the existing `noDrill`/`setSpaceDrillable` pattern end-to-end for both new constraints (`railPresent` as its inverse, `maxWeightLbs` as a new post-pack check) — no new abstractions needed, matching the "Layer 1 extension, not Layer 2 solver" scoping call in design.md.
- `bd mol pour openspec-sync` + manual task expansion produced 4 well-scoped, dependency-ordered beads (catalog + assembly → store → web) that mapped cleanly to the package DAG, letting catalog/assembly proceed in parallel before store/web.
- Widening `ConstraintFailure` to a 3-member union surfaced two real, pre-existing narrowing gaps in `packages/packer` tests via `tsc --noEmit` — caught before merge, not at runtime.

## §2 Misses

- `design.md`'s "Package Impacts & Code Verification" section was inaccurate on every package it claimed to have verified: `packages/catalog/src/BinSpec.ts` doesn't exist (`bin.ts` does, and it's a plain interface, not a Zod `BinSpecSchema`); `packages/store/src/selectors/layoutSelectors.ts` doesn't exist (no `selectors/` subfolder — it's `packages/store/src/layoutSelectors.ts`); the claim that callers "narrow on reason" for `ConstraintFailure` was false for two `packages/packer` test files. Every one of these required a live re-check against the actual code before implementing, and the union-widening one required unplanned fixes outside the bead's own package scope.

## §3 Surprises

- `bd dep add <a> <b>` semantics (`a` depends on `b`, i.e. `b` blocks `a`) are easy to invert by accident when wiring a batch of cross-bead dependencies from a description in your head rather than checking `bd dep tree` after each add — did this wrong on the first attempt for the store task's deps and had to detect it via a "would create a cycle" error, then diagnose and fix with `bd dep remove`/`bd dep add` in the correct direction.
- `bd create --parent <short-prefix-id>` needs `--force` due to a known dotted-child-ID-vs-full-prefix validation quirk — already logged in bd's own memory system, so this cost no time once spotted.

## §4 Promote

- [ ] Treat a design doc's "Code Verification" section as a claim, not a fact — re-grep the named files/exports before scoping a bead against them, same as the Bead Task Contract already requires for literal-value scoping.
- [ ] After wiring cross-bead dependencies with `bd dep add`, immediately run `bd dep tree` on the dependent bead to confirm direction before moving on — cheaper than diagnosing a cycle error later.
- [ ] When widening a shared discriminated union (e.g. `ConstraintFailure`), grep the whole repo for narrowing on the old member set (`reason !== "x"`, `.filter/.find` on the union) before considering the task's own package done — `tsc --noEmit` will catch it, but only if you run the full repo typecheck, not just the package-scoped one.
