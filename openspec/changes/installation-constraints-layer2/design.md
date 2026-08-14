# Technical Design: Installation Constraints (maxWeightLbs & railPresent)

## Context

The `installation-constraints` feature governs how space-level installation requirements filter eligible catalog items and validate placed storage layouts.
While the initial `noDrill` slice filters out `drill`-requiring bins prior to packing, `railPresent` (pre-packing unlock) and `maxWeightLbs` (post-packing budget) were deferred.
This design specifies the data flow, schemas, and selector integration required to support `maxWeightLbs` and `railPresent` within the Layer 1 sync pipeline in `packages/store`, eliminating the need for an async Layer 2 solver service.

## Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                              apps/web                                   |
|   Constraint Editor Panel: toggles `railPresent` & sets `maxWeightLbs`  |
+-------------------------------------------------------------------------+
                                    |
                                    v (Zustand Store Action)
+-------------------------------------------------------------------------+
|                           packages/store                                |
|  1. `resolveSpace`:                                                     |
|     - Filter catalog bins:                                              |
|       - `noDrill` set  => exclude `installation.type === "drill"`       |
|       - `rail` bin     => exclude UNLESS `railPresent` constraint set   |
|  2. `packSpace` (packages/packer):                                      |
|     - Computes synchronous 2D layout                                   |
|  3. Post-Pack Weight & Constraint Verification:                         |
|     - Total Weight = sum(bin.count * bin.weightLbs)                     |
|     - If Total Weight > maxWeightLbs => append WeightOverflowFailure    |
+-------------------------------------------------------------------------+
```

## Schema Definitions

### 1. Catalog Bin Weight Extension (`packages/catalog`)

`BinSpecSchema` gains an optional non-negative `weightLbs` property:

```ts
export const BinSpecSchema = z.object({
  // ... existing fields ...
  weightLbs: z.number().nonnegative().optional(),
});
```

### 2. Weight Overflow Failure (`packages/assembly`)

`PackingResult.ts` adds `WeightOverflowFailure` to `ConstraintFailure`:

```ts
export type WeightOverflowFailure = {
  readonly reason: "weightOverflow";
  readonly maxWeightLbs: number;
  readonly actualWeightLbs: number;
};

export type ConstraintFailure =
  | CountConstraintFailure
  | HeightOverflowFailure
  | WeightOverflowFailure;

export const createWeightOverflowFailure = (
  maxWeightLbs: number,
  actualWeightLbs: number,
): WeightOverflowFailure => ({
  reason: "weightOverflow",
  maxWeightLbs,
  actualWeightLbs,
});
```

### 3. Assembly InstallationConstraint Schema (`packages/assembly`)

`InstallationConstraintSchema` in `BaseTypes.ts` is verified to support `maxWeightLbs` and `railPresent`:

```ts
// Existing Zod discriminator in BaseTypes.ts:
z.object({
  type: z.literal("maxWeightLbs"),
  value: z.number().positive(),
  notes: z.string().optional(),
}).readonly(),
z.object({
  type: z.literal("railPresent"),
  notes: z.string().optional(),
}).readonly(),
```

## Package Impacts & Code Verification

Verification pass over current codebase (`packages/`):
- `packages/catalog/src/BinSpec.ts`: `BinSpec` currently lacks `weightLbs`; addition is backwards-compatible (optional field).
- `packages/assembly/src/PackingResult.ts`: `ConstraintFailure` union handles Discriminated Union pattern on `reason`; callers handling `failures` array narrow on `reason`.
- `packages/store/src/selectors/layoutSelectors.ts`: `resolveSpace` currently filters `noDrill` in line 142 (`bin.installation?.type !== "drill"`). Extending this check to require `railPresent` for `installation?.type === "rail"` is localized and synchronous.

## Trade-offs & Layer Scoping

- **Layer 1 Extension vs. Layer 2 Async Solver:**
  - **Decision:** Keep `maxWeightLbs` and `railPresent` inside `packages/store`'s synchronous layout resolution pipeline (Layer 1).
  - **Rationale:** Neither constraint requires complex non-linear mathematical optimization or remote async solvers. `railPresent` is a standard pre-pack boolean filter, and `maxWeightLbs` is a simple $O(N)$ post-pack arithmetic validation. Moving them to a Layer 2 package would introduce unnecessary architectural overhead.
