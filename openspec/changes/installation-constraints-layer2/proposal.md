# Proposal: Installation Constraints — maxWeightLbs and railPresent

## Why

The initial `installation-constraints` change (archived 2026-07-16) introduced the catalog `installation` field on `BinSpec` and single-space `noDrill` filtering.
Two installation constraint types were deferred from that initial slice:

1. `maxWeightLbs`: per-space weight-budget aggregation across placed bin quantities.
2. `railPresent`: conditional catalog expansion/unlock logic for wall-mounted/rail-mounted storage bins.

`packages/assembly` already defines `InstallationConstraintSchema` with `{ type: "maxWeightLbs", limitLbs: number }` and `{ type: "railPresent" }`, but neither is evaluated in `packages/store` or surfaced in `apps/web`.
This proposal defines how `maxWeightLbs` and `railPresent` are validated within the system topology — determining whether they belong to an extension of Layer 1 (synchronous selector filtering and post-pack layout validation in `packages/store`) or require a new Layer 2 async solver package.

## What Changes

- **Architecture scoping:**
  - `railPresent` is a pre-packing catalog unlock filter (inverse of `noDrill`). Bins with `installation.type === "rail"` are locked/disabled in the catalog and excluded from `PackInput` unless the space template contains a `{ type: "railPresent" }` constraint. This fits cleanly as a **Layer 1 extension in `packages/store`**.
  - `maxWeightLbs` is a post-packing aggregate weight budget. After `packSpace` returns placed bin quantities, `packages/store` calculates aggregate weight across placed bins. If total weight exceeds `maxWeightLbs`, a `weightOverflow` constraint failure is appended to `LayoutResolution`. This also fits as a **Layer 1 extension in `packages/store`** without requiring a new Layer 2 package, keeping Layer 1 synchronous and pure.
- **Catalog schema addition:**
  - `packages/catalog`: add optional `weightLbs?: number` to `BinSpec` (defaults to 0 if omitted).
- **Assembly schema refinement:**
  - `packages/assembly`: refine `InstallationConstraintSchema` so `maxWeightLbs` carries `limitLbs: number`. Add `createWeightOverflowFailure` helper to `ConstraintFailure`.
- **Store logic:**
  - `packages/store`: in `resolveSpace`, update bin eligibility filtering to require `{ type: "railPresent" }` for `rail`-type bins. Add post-pack weight summation and flag `weightOverflow` in `LayoutResolution.failures`.
- **Web UI:**
  - `apps/web`: surface "Max Weight Limit (lbs)" input and "Mounting Rail Present" checkbox in the constraint editor panel.

## Capabilities

### New Capabilities

- `installation-constraints-rail-present`: `rail`-requiring catalog bins are unlocked for packing and UI selection only when `railPresent` is set on the space.
- `installation-constraints-max-weight`: spaces can enforce a maximum weight limit, reporting a `weightOverflow` failure when total placed bin weight exceeds the limit.

### Modified Capabilities

- `installation-constraints`: extended from `noDrill`-only to support `railPresent` and `maxWeightLbs`.

## Impact

- Affected packages in DAG (`geometry → catalog → assembly → packer → store → web`):
  - `packages/catalog`: add optional `weightLbs` to `BinSpec`.
  - `packages/assembly`: refine `maxWeightLbs` in `InstallationConstraintSchema` and add weight overflow failure factory.
  - `packages/store`: update `resolveSpace` for `railPresent` filtering and `maxWeightLbs` aggregation.
  - `apps/web`: UI controls in constraint editor.
- Unaffected packages: `packages/geometry`, `packages/packer`.
- Monorepo Topology: No new package DAG nodes or lateral import edges required.

## Success Criteria

- `rail`-type bins are greyed in the catalog list and omitted from `PackInput` unless `railPresent` is active on the space.
- When placed bins in a space exceed `maxWeightLbs`, `selectPackedLayout` returns a `LayoutResolution` containing a `weightOverflow` failure detail.
- Existing `noDrill` filtering and un-constrained space packing pass all tests without regression.
- `bun run lint`, `bun run typecheck`, and `bun test` pass across all packages.
