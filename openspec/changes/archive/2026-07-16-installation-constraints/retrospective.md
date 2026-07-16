# Retrospective: installation-constraints

## §0 Evidence

- **Commit Range**: c6927fd (scope) → 8ed1e1b (implement), PRs #232 and #233, merged to `main`.
- **Tasks Completed**: 4/4 — sm-5feh (catalog: `BinSpec.installation` field), sm-5xj6 (store: `setSpaceDrillable` + `isBinInstallationAllowed` filter), sm-l8x4 (web: constraint-editor toggle + Add Bins greying), sm-6tip (e2e coverage, scope narrowed — see §2).
- **Beads Closed**: sm-g4fk (parent), sm-5feh, sm-5xj6, sm-l8x4, sm-6tip — all `CLOSED`.
- **Test Status**: `bun run lint` clean, `bun run typecheck` clean, `bun test` 146/146 pass (454 assertions, 24 files). PR #233 CI (`verify`, `validate`, `e2e`) all `SUCCESS` on merge.

## §1 Wins

- Both-lists filtering (`isBinInstallationAllowed`) landed as a pure function in `packages/store`, keeping Layer 1 purity intact — no solver/Layer 2 creep.
- Design → implementation stayed dependency-chained and sequential (catalog → store → web → e2e), which matched the actual DAG and avoided rework.
- A subagent correctly self-blocked on sm-6tip instead of fabricating a drill-SKU fixture, flagging it with `human` label and filing sm-jaog instead of guessing.

## §2 Misses

- No real catalog SKU has a defensible `installation.type: "drill"` value (Gridfinity snaps into baseplates; Schaller/Akro-Mils are freestanding/rail-mount) — sm-6tip's e2e scope was narrowed to the default (non-drill) path only. Full drill-exclusion e2e coverage is blocked on sm-jaog (real SKU decision or test-fixture seam).
- `tasks.md` checkboxes never flipped to `[x]` despite all beads closing — this is the known sm-yh2k gap (no automated bd-close ↔ tasks.md sync), not specific to this change.
- The feature-probe formula's auto-generated acceptance text guessed at Zod-schema/packer involvement before real code was read; actual implementation needed neither (no new Zod schema, `packages/store` not `packer`). Filed as sm-6b5e.

## §3 Surprises

- The "both-lists" constraint model (allow-list + deny-list reconciliation) was cheaper to implement in `packages/store` than anticipated during design — no new domain type was needed, just a derived selector over existing `BinSpec.installation` + `SpaceConstraint`.
- Human-review checkpoint (sm-mol-aorp) caught nothing that required revision — design.md was approved as-drafted, suggesting the Fable-scoping → Sonnet-implementation split is producing designs solid enough to survive adversarial review on the first pass.

## §4 Promote

- [ ] sm-jaog (real drill-SKU or fixture-seam decision) should get prioritized before another installation-type constraint ships, otherwise drill-exclusion stays permanently under-tested.
- [ ] sm-6b5e (hedge feature-probe formula's acceptance-text wording) should land before the next feature-probe chain is poured, to avoid repeating the same guessed-schema pattern on options-mode.
