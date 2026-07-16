## Why

`packages/catalog/src/installationRequirement.ts` defines an `InstallationRequirement` type (`drill` / `rail` / `adhesive` / `freestanding` / `stack-only`) with zero references anywhere else in the codebase — it is not a field on `BinSpec`, not read by the packer, and has no UI surface.
Meanwhile `packages/assembly` already carries the other half of the feature: `InstallationConstraintSchema` (`noDrill`, `noAdhesive`, `maxWeightLbs`, `noWallMount`, `railPresent`, `custom`) exists in `BaseTypes.ts` and every `SpaceTemplate` has an `installationConstraints` array, but `createSpaceTemplate` always sets it to `[]` and nothing ever reads it.
PRD §4.3 and §6.2 describe the intended behavior: users answer plain-language questions per space ("Can I drill into the back wall?"), which filters incompatible bins — greyed in the catalog and excluded from auto-fill — before packing.
Today neither side is wired to the other, so the constraint data model is dead weight on both ends.

## What Changes

- `packages/catalog`: add an optional `installation?: InstallationRequirement` field to `BinSpec` (schema only) so bins can declare how they mount. Existing catalog entries omit the field and are treated as `freestanding`-equivalent (never filtered).
- `packages/store`: add a store action to set/unset a `{ type: "noDrill" }` entry in the active space template's existing `installationConstraints` array (today only `addTemplate` exists — there is no action that updates a template after creation). In `layoutSelectors.resolveSpace`, exclude bins whose `installation.type === "drill"` from the `PackInput` list passed to `packSpace` when the template carries `noDrill`, so packing and auto-fill never place them.
- `apps/web`: surface one plain-language question in the constraint editor panel — "Can I drill into this space?" — that drives the new store action, and grey/disable drill-requiring bins in the panel's Add Bins catalog list while `noDrill` is set.
- No changes to `packages/geometry`, `packages/assembly` (its `InstallationConstraintSchema` and `SpaceTemplate.installationConstraints` are reused as-is), or `packages/packer` (`PackInput` stays purely geometric; filtering happens upstream in the store selector, which already imports both catalog and packer legally under the DAG).
- Explicitly deferred to a follow-on change: `maxWeightLbs` and `railPresent`. Both need per-space aggregate or unlock logic that is solver-adjacent (weight budgeting across placed quantities; conditionally expanding the eligible catalog), which does not fit Layer 1's synchronous 2D geometric fitting and may belong to the deferred Layer 2 constraint-validation layer. This change ships only the boolean exclude-by-type path.

## Capabilities

### New Capabilities

- `installation-constraints`: bins declare an installation requirement, a space can declare `noDrill` via one plain-language toggle, and drill-requiring bins are greyed in the catalog list and excluded from packing/auto-fill for that space.

### Modified Capabilities

(none — existing `storage-layout` and `drawer-space-manager` requirements are unchanged; spaces without `noDrill` and bins without an `installation` field behave exactly as today)

## Impact

- Affected packages: `packages/catalog` (schema-only `BinSpec` addition), `packages/store` (template-update action + selector filtering), `apps/web` (constraint editor toggle + greying). DAG order `geometry → catalog → assembly → packer → store → web` is respected; no new packages and no new edges.
- Not affected: `packages/geometry`, `packages/assembly`, `packages/packer`.
- Persistence: `SpaceTemplate.installationConstraints` is already part of the serialized template shape, so no new persistence format; sketch serialization round-trips need coverage for a non-empty array.
- A full technical design (data-flow diagram, Zod schema specifics, exact store action signature) is a separate follow-on bead (sm-mol-vizp) and is intentionally out of scope here.

## Success Criteria

- With `noDrill` set on a space, every catalog bin whose `installation.type === "drill"` renders greyed/disabled in the constraint editor's Add Bins list, and the packed layout for that space contains zero placements of such bins.
- With `noDrill` unset (the default), behavior is byte-for-byte identical to today: no bin is filtered, and existing e2e and unit suites pass unchanged.
- Bins without an `installation` field are never filtered, so the current catalog keeps working before any entries are annotated.
- `bun run lint`, `bun run typecheck`, and `bun test` pass with changes confined to `packages/catalog`, `packages/store`, and `apps/web`.
