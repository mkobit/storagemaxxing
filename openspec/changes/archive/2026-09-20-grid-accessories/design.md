## Context

`BinSpec` (`packages/catalog/src/bin.ts:12-28`) is a plain TypeScript interface — not a Zod schema — used identically by all four vendor catalogs (`SCHALLER_CATALOG`, `GRIDFINITY_CATALOG`, `AKROMILS_CATALOG`, `OPENGRID_CATALOG`), joined into `ALL_BINS` in `packages/catalog/src/lookup.ts:8-13`.
Gridfinity (`packages/catalog/src/gridfinity.ts`) and OpenGrid (`packages/catalog/src/opengrid.ts`) currently only generate plain bin footprints (grid-unit cross products × heights). Neither has any notion of a non-bin item.
The `GridAccessory` name from `docs/2026-04-13-PRD.md` was never implemented — `rg -n "GridAccessory" packages/` returns zero hits.

Downstream, three packages consume `BinSpec`:

- `packages/packer/src/PackInput.ts:45-54` (`toPackInput`) reads only `id`, `w`/`l`/`h` (from `actual`), and `toleranceW`/`L`/`H` — it does not read `system`, `kind`, or any other field, and discards everything else. Confirmed by reading the function body directly (not inferred).
- `packages/assembly/src/bom.ts:79-112` (`computeBom`) and `:114-148` (`computeAggregateBom`) key everything off `binId` counts and call `lookupBin(binId)` to fetch price — they never branch on any bin field other than price/`priceApproximate`.
- `apps/web/src/ui/ConstraintEditorPanel.tsx:76-98` filters `ALL_BINS` by `bin.system === detectedSystem` into a single flat list (`compatibleBins`/`filteredBins`), then `handleAddBinConstraint` calls `createSpaceConstraint(id, 1, 0)` (`packages/assembly/src/SpaceConstraint.ts:72`) for whichever `id` was clicked — the handler itself is item-shape-agnostic.
- `apps/web/src/ui/bom/BOMRow.tsx:11` already calls `findBinById(ALL_BINS, binId(item.binId))` per row to resolve `sku`/`name`/`price` for display — it already has the full `BinSpec` in scope, not just the narrow `BOMItem { binId, quantity }` shape.

This means the entire packing/BOM pipeline is generic over "anything with an id, a footprint, and a price" and requires no changes to accept a new item shape, as long as that shape still satisfies `BinSpec`'s existing required fields.

## Goals / Non-Goals

**Goals:**

- Add a `kind`/`accessoryType` discriminant to `BinSpec` that is purely additive (existing bin entries unaffected, default `kind: "bin"`).
- Populate Gridfinity accessory data (hook, label, divider, blank — 42mm/7mm-grid-derived) and OpenGrid accessory data (hook, accessory bin — 28mm-grid-derived).
- Expose accessories in the Configure UI's constraint editor and distinguish them in the BOM UI.
- Correct `docs/2026-04-13-PRD.md`'s "75mm panel system" claim for OpenGrid to the correct 28mm (per the real spec and this repo's own `opengrid.ts:18-19` comment).

**Non-Goals:**

- No changes to `packages/packer` placement logic. Every accessory occupies at least one grid cell (confirmed against the real Gridfinity/OpenGrid specs during research), so it packs as an ordinary footprint rectangle.
- No new "attached, not packed" placement model (e.g., true wall-mounted hooks rendered outside a space's packed footprint). `packages/assembly/src/SpaceTemplate.ts:21-50`'s `packingModel` and `PackingResult.ts`/`PlacedBin.ts`'s `Point3D`-origin model are unchanged; accessories are placed exactly like bins.
- No Zod schema conversion for `BinSpec` itself — it stays a plain interface, matching every existing catalog file's pattern. Only the new discriminant fields are added to the interface.
- No changes to `SpaceTypeIdSchema`'s `"wall"`/`"pegboard"` literals (`packages/assembly/src/BaseTypes.ts`) — those are unrelated to this change (they describe space types, not catalog items) and remain unwired, as they are today.

## Decisions

### 1. `BinSpec` is a discriminated union, not a separate accessory collection type

```ts
// packages/catalog/src/bin.ts
export type AccessoryType =
  "hook" | "label" | "divider" | "blank" | "cable_clip" | "custom";

interface BaseBinSpec<T extends number = number> {
  readonly id: BinId;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly system?: StorageSystem;
  readonly catalogSource: CatalogSource;
  readonly price?: number;
  readonly priceApproximate?: boolean;

  readonly nominal: Dimensions3D<T>;
  readonly actual: Dimensions3D<T>;
  readonly tolerance: Dimensions3D<T>;

  readonly installation?: InstallationRequirement;
  readonly weightLbs?: number;
}

interface StandardBinSpec<T extends number = number> extends BaseBinSpec<T> {
  readonly kind: "bin";
  readonly accessoryType?: never;
}

interface AccessoryBinSpec<T extends number = number> extends BaseBinSpec<T> {
  readonly kind: "accessory";
  readonly accessoryType: AccessoryType;
}

export type BinSpec<T extends number = number> =
  StandardBinSpec<T> | AccessoryBinSpec<T>;
```

One shared exported union type keeps every downstream consumer (`ALL_BINS: ReadonlyArray<BinSpec>`, `findBinById`, `toPackInput`, `computeBom`) unchanged because they only use fields common to both branches.
Consumers need a type guard only when reading an accessory-specific field, which is the desired proof that `accessoryType` exists for an accessory.

`kind` is a required field, not optional, so every existing catalog file (`schaller.ts`, `akromils.ts`, plus the accessory literals added to `gridfinity.ts`/`opengrid.ts`) must be updated to add `kind: "bin"` to its entries. This is a mechanical, compiler-enforced migration (TypeScript will fail to build until every entry sets `kind`) rather than a silent default, which avoids a stale-data class of bug where a future catalog file forgets the field.

`accessoryType` is required by the accessory branch and forbidden on the ordinary-bin branch, so TypeScript rejects malformed catalog literals before they reach a lookup or test setup.

### 2. Accessories are generated as `BinSpec` literals in the existing catalog files, not a new `packages/catalog/src/accessories.ts`

Gridfinity accessory data goes in `gridfinity.ts` (or a co-located `gridfinityAccessories.ts` imported by it and re-exported as part of `GRIDFINITY_CATALOG`), following the same `id`/`sku`/dimension-derivation pattern already used for bins (see `gridfinity.ts:18-58`: grid units × 42mm/7mm → nominal → actual via tolerance). OpenGrid accessories follow the same pattern in `opengrid.ts` at 28mm.
This keeps `packages/catalog/src/lookup.ts:8-13`'s `ALL_BINS` composition (`[...SCHALLER_CATALOG, ...GRIDFINITY_CATALOG, ...AKROMILS_CATALOG, ...OPENGRID_CATALOG]`) unchanged — accessories are folded into each vendor's existing exported array, not a fifth spread entry, since `lookup.ts` should not need to know accessories exist as a category.

### 3. UI: split `compatibleBins` into two filtered lists, reuse `handleAddBinConstraint` unchanged

```
ConstraintEditorPanel.tsx (current, line 76-78)
  compatibleBins = ALL_BINS.filter(bin => bin.system === detectedSystem)

ConstraintEditorPanel.tsx (after this change)
  compatibleItems    = ALL_BINS.filter(bin => bin.system === detectedSystem)
  compatibleBins     = compatibleItems.filter(item => item.kind === "bin")
  compatibleAccessories = compatibleItems.filter(item => item.kind === "accessory")
```

Both render through the existing `filteredBins`-style search-filter + list pattern (lines 80-82), in a new "Add Accessories" section alongside the existing "Add Bins" section. `handleAddBinConstraint` (line 92-98) takes only an `id` string and calls `createSpaceConstraint(id, 1, 0)` — it has no bin-specific logic, so both sections call the same handler with no changes to `packages/assembly/src/SpaceConstraint.ts`.

### 4. BOM UI reads `kind` from the already-resolved `BinSpec`, no `BOMItem` schema change

`BOMRow.tsx:11` already calls `findBinById(ALL_BINS, binId(item.binId))` to get `spec` for `sku`/`name`/`price`. Grouping/labeling accessory rows reads `spec?.kind` from that same resolved object — no change to `BOMItem` (`packages/assembly/src/BaseTypes.ts`) or to `computeBom`/`computeAggregateBom`'s signatures. This removes the "optional `BOMItem` carries `kind`" item from the original research breakdown — it turned out unnecessary once `BOMRow.tsx` was actually read.

### Data flow (unchanged pipeline, new data shape flowing through it)

```
gridfinity.ts / opengrid.ts
  BinSpec[] (kind: "bin" | "accessory")
        |
        v
  lookup.ts: ALL_BINS (unchanged composition)
        |
        +----------------------------+
        v                            v
ConstraintEditorPanel.tsx      packer/PackInput.ts: toPackInput()
  split by kind for display      (reads id/w/l/h/tolerance only --
  -> createSpaceConstraint()      kind is dropped, packs identically)
        |                            |
        v                            v
  SpaceConstraint                PackingResult / PlacedBin
        |                            |
        +-------------+--------------+
                       v
              assembly/bom.ts: computeBom()
              (keys off binId + lookupBin(id).price -- kind-agnostic)
                       |
                       v
              BOMRow.tsx: findBinById() resolves full BinSpec,
              reads .kind for display grouping only
```

## Package Impacts & Code Verification

Every path and exported symbol below was spot-checked with `Read`/`rg` against the current tree immediately before writing this section (not inferred from naming convention):

- `packages/catalog/src/bin.ts` — `BinSpec` interface, confirmed plain interface (not Zod), lines 12-28 read directly.
- `packages/catalog/src/gridfinity.ts` — exports `GRIDFINITY_CATALOG: ReadonlyArray<BinSpec>`, confirmed full file read; uses `system: "gridfinity"` string literal (typed via `StorageSystemSchema` in `packages/catalog/src/StorageSystem.ts:3-9`, confirmed `z.enum(["schaller","gridfinity","akromils","opengrid","custom"])`).
- `packages/catalog/src/opengrid.ts` — exports `OPENGRID_CATALOG`, referenced from `lookup.ts:6,12`; `:18-19` comment confirms 28mm grid unit (not 75mm as the PRD states).
- `packages/catalog/src/lookup.ts` — `ALL_BINS` (lines 8-13), `findBinById` (15-20), confirmed full file read.
- `packages/packer/src/PackInput.ts` — `toPackInput` (lines 45-54), confirmed by reading the full function body: reads only `id`, `actual.w/l/h`, `tolerance.w/l/h`. No `system`/`kind` field is read anywhere in this file.
- `packages/assembly/src/bom.ts` — `computeBom` (79-112), `computeAggregateBom` (114-148), confirmed by reading both function bodies; neither branches on any field beyond `price`/`priceApproximate` (via `getPrice`/`isPriceApproximate` helpers above line 79).
- `apps/web/src/ui/ConstraintEditorPanel.tsx` — `compatibleBins`/`filteredBins` (76-82), `handleAddBinConstraint` (92-98), `createSpaceConstraint` import from `@storagemaxxing/assembly/SpaceConstraint` (line 7-10), confirmed by reading lines 1-100.
- `apps/web/src/ui/bom/BOMRow.tsx` — confirmed full file read (27 lines): already resolves `spec` via `findBinById(ALL_BINS, binId(item.binId))` at line 11.
- `apps/web/src/ui/bom/BOMTable.tsx`, `apps/web/src/ui/BOMPanel.tsx` — confirmed to exist via `fd -i bom apps/web/src` (not yet read in full; will be read during implementation of tasks 6-7).
- `apps/web/src/ui/LayoutCanvas.tsx` — confirmed to exist via `fd LayoutCanvas apps/web` (optional polish task 8 only; not read in full, out of scope for the core change).
- `docs/2026-04-13-PRD.md:1004` — confirmed the "75mm panel system" wording via prior read of the roadmap table.

No file path or exported symbol referenced above was assumed from naming convention alone; every one was read or grepped directly in this session.

## Risks / Trade-offs

- **`kind` becoming a required field is a breaking type change to `BinSpec`.** Every existing catalog literal in `schaller.ts` and `akromils.ts` (not just `gridfinity.ts`/`opengrid.ts`) must add `kind: "bin"`, or the build fails. This is intentional (see Decision 1) but means tasks.md must include a mechanical pass over all four catalog files, not just the two grid systems, or `bun run typecheck` fails at the package boundary.
- **PRD wording fix is a documentation-only, no-test-coverage change.** There's no automated guard against the PRD drifting from the real spec again; accepted as low-risk since it's prose, not code.
- **`BinSpec` is a union, so branch-specific fields require narrowing.** This is limited to consumers that read `accessoryType`; existing packing, lookup, and BOM consumers read common fields only and require no code changes.
- **Real-world Gridfinity/OpenGrid accessory dimensions are approximations.** Neither system publishes an official machine-readable spec for every accessory (labels/dividers especially vary by third-party manufacturer); catalog data here is illustrative/typical dimensions, consistent with how `price: 0`/`priceApproximate` is already handled for other builtin catalog entries — not a new precision bar this change must clear.

## Adversarial Audit

- **Does `detectedSystem` filtering in `ConstraintEditorPanel.tsx:55-78` break if an accessory has no compatible bin already in the space?** No — `detectedSystem` falls back to `activeSpace.system`, then the first existing constraint's bin's `system`, then template-name string matching, then defaults to `"gridfinity"`. It never reads `kind`, so accessory-only spaces resolve identically to bin-only spaces. Verified by reading lines 55-78 directly (not assumed).
- **Could `computeAggregateBom`'s `space.placedBins` fallback path (`bom.ts:126-132`, used when no live `PackingResult` exists) silently drop accessories?** No — that path counts by `bin.binId` from `PlacedBin[]` with no field-based filtering, so an accessory's `PlacedBin` entry (same shape as a bin's) is counted identically. Verified by reading `bom.ts:114-148` in full.
- **Does adding a required `kind` field break any existing test fixture that constructs a `BinSpec` object literal inline (not via a catalog file)?** Yes, confirmed by `rg -n "catalogSource:" --type ts -l`, which is the most distinctive required `BinSpec` field for finding inline literals: beyond the four vendor catalog files, it also appears in `packages/assembly/src/bom.test.ts`, `packages/catalog/src/bin.test.ts`, `packages/store/test/layout-installation-constraints.test.ts`, `packages/store/test/options-mode-strategies.test.ts`, `packages/store/test/apply-space-strategy.test.ts`, `apps/web/e2e/fixtures/catalogWithDrillFixture.ts`, `apps/web/src/ui/wireframeScene.test.ts`, `apps/web/src/ui/viewportFit.test.ts`, `apps/web/src/ui/bom/exportCSV.test.ts`, and `apps/web/src/ui/ConstraintEditorPanel.test.tsx`. Every one of these needs `kind: "bin"` added to its fixture literal(s) or the build fails. tasks.md must include this exact file list as a dedicated task, not a generic "update fixtures" line — the list above is unlikely to be fully guessed from memory during implementation.
- **Sync conflict risk:** this change only adds fields and data; it does not modify any existing requirement in `openspec/specs/storage-layout/spec.md`, so it should not conflict with any other in-flight change to that capability. The only other active change in the repo (`unattended-agent-sandbox`, per `openspec status`) is unrelated (agent sandboxing, not catalog data) — no overlap.
