## Context

`storage-layout` is the only product-facing capability and ships as a single golden path: catalog → assembly → packer → store → web.
Each layer has a sharp internal contract — the packer reports `valid | partial | invalid`, the catalog returns `undefined` on a miss, the store filters and projects — but the contracts erode at the seams:

- The packer's validity model is rich but only consulted in tests; the web app reads `result.placedBins` and renders them regardless of validity.
- The store's selector squashes three different "no layout" cases (no active space, missing template, missing catalog entries) into a single `null` return plus a silent `.filter`.
- The catalog's miss contract (`findBinById` returning `undefined`) is implicit in the codebase but not in the spec, so a future refactor could change it without spec validation.

Current selector signature:

```ts
export const selectPackedLayout = (state: LayoutInputs): PackingResult | null
```

`null` means: no active space, OR missing template, OR every constraint had an unresolvable bin.
The caller cannot distinguish these.
Inside the helper, `constraints.map(...).filter(b !== undefined)` silently drops misses, so the `PackingResult` reflects a different bin set than the caller asked for.

Target selector signature:

```ts
export type LayoutResolution =
  | { readonly kind: "none" }
  | { readonly kind: "missing-template"; readonly templateId: string }
  | {
      readonly kind: "resolved";
      readonly result: PackingResult;
      readonly unresolvedBinIds: readonly string[];
    };

export const selectPackedLayout = (state: LayoutInputs): LayoutResolution
```

Target data flow (additions in **bold**):

```
catalog (findBinById → BinSpec | undefined)        <-- miss is explicit
   |
   |  store collects misses into unresolvedBinIds
   v
store (LayoutResolution: none | missing-template | resolved+unresolvedBinIds)
   |
   v
web (renders by tag: empty state | error banner | canvas + partial-validity badge)
```

## Goals / Non-Goals

**Goals:**

- Make every "the layout you see does not match what you asked for" case observable in a typed return value, in tests, and in the rendered UI.
- Lock in the catalog's miss contract and the packer's empty-constraints contract as spec, not coincidence.
- Keep behavior on the golden path byte-identical: a fully-resolved selection with a valid pack must render the same canvas as today.

**Non-Goals:**

- No change to `packSpace` internals or the packer's validity model. The packer is the source of truth for validity; this change just propagates that signal up.
- No new catalog data, no new bin lookups, no new packing strategies.
- No internationalized error messages or user-facing copy beyond what is needed to gate the E2E test (a stable `data-testid` is enough).

## Decisions

### D1 — Replace `PackingResult | null` with a tagged `LayoutResolution`

The selector returns a discriminated union over `kind`:

- `"none"`: no active space. Equivalent to today's `null` when `state.activeSpaceId` is null or the lookup misses.
- `"missing-template"`: the active space points to a `templateId` not in `state.templatesById`. Carries the offending `templateId` for diagnostics. Equivalent to today's silent `null`.
- `"resolved"`: the space and template resolved. Carries the `PackingResult` (which can itself be `valid`, `partial`, or `invalid`) and `unresolvedBinIds: readonly string[]` — every constraint whose `binId` did not resolve in the catalog.

Zod schemas live with their types in `packages/store/src/layoutSelectors.ts`:

```ts
export const LayoutResolutionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }).readonly(),
  z.object({ kind: z.literal("missing-template"), templateId: z.string() }).readonly(),
  z.object({
    kind: z.literal("resolved"),
    result: PackingResultSchema,
    unresolvedBinIds: z.array(z.string()).readonly(),
  }).readonly(),
]);
export type LayoutResolution = z.infer<typeof LayoutResolutionSchema>;
```

The existing `selectPackingResultsBySpace` (multi-space variant) returns `Readonly<Record<string, LayoutResolution>>` with one entry per space (rather than skipping spaces that don't resolve, as today).

### D2 — Render branches in `apps/web/src/ui/LayoutCanvas.tsx`

`LayoutCanvas` (or the parent that holds it) branches on `LayoutResolution.kind`:

- `none` → render the existing empty state.
- `missing-template` → render an error banner identifying the `templateId`. Add `data-testid="layout-error-missing-template"` so the E2E gate is stable.
- `resolved` → render the canvas as today, plus:
  - A validity badge in the corner reading `valid`/`partial`/`invalid` (with color: green/amber/red). `data-testid="layout-validity-badge"`.
  - If `unresolvedBinIds.length > 0`, an additional badge listing the count. `data-testid="layout-unresolved-count"`.

No new UI library, no new dependencies — Tailwind classes only.

### D3 — Catalog miss contract (Scenario only, no code change)

Spec adds a Scenario under `Catalog Golden-Path Systems`:

> **WHEN** `findBinById(ALL_BINS, id)` is called with an `id` not present in the catalog
> **THEN** it MUST return `undefined` (never throw, never return a placeholder).

Verified by adding a single assertion to `packages/catalog/test/golden-path.test.ts`.

### D4 — Empty-constraints packer contract (Scenario only, no code change)

Spec adds a Scenario under `Golden-Path Packing`:

> **WHEN** `packSpace` is called with an empty constraints array
> **THEN** the returned `PackingResult` has `validity === "valid"`, `placedBins.length === 0`, and `metrics.failures.length === 0`.

Verified by adding a single assertion to `packages/packer/test/golden-path.test.ts`.

### D5 — E2E gates partial-pack case

`apps/web/e2e/golden-path.spec.ts` gains a new test: load a space template too small to fit all starter bins, assert the validity badge reads `partial` (via the `data-testid` from D2), and assert the canvas still renders the bins that fit.

Trade-off: the new test needs a deterministic small-space fixture. Add it as a new `goldenPathPartialSetup` fixture alongside the existing golden-path setup so the existing test stays untouched.

## Risks / Trade-offs

- **Breaking caller signature**: `selectPackedLayout` going from `PackingResult | null` to `LayoutResolution` touches every consumer. Mitigation: codemod-style search/replace; the typechecker will surface every site. The store package owns the only consumers today (`apps/web` is the only caller), so the blast radius is bounded.
- **UI complexity creeps**: validity badges and error banners can grow into a notification system. Mitigation: cap this change at two badges + one banner, all with `data-testid` selectors only. Anything richer (toasts, settings) goes through its own capability proposal.
- **Visual regression**: the badge changes the canvas's screenshot. Mitigation: update the E2E pixel assertion if it exists (likely it asserts a small region, not the badge corner). Verify before merge.
- **`LayoutResolution` is a discriminated union, not a `Result<T, E>`**: a `Result` type would unify error handling across the store but is a larger refactor. We pick the narrow domain-specific shape now and revisit once a second selector wants the same pattern.
- **Persisted state and `LayoutResolution`**: the selector is derived, not persisted, so Zustand `partialize` is unaffected. Verify with `rg "selectPackedLayout" apps/web/`.

## Adversarial Audit

- **Empty `unresolvedBinIds` is structurally different from missing field**: a consumer doing `if (result.unresolvedBinIds)` will trip on the truthy empty array. Mitigation: document and use `.length > 0` in the UI branch.
- **What if a constraint resolves but is malformed (e.g., zero-dimension bin)?**: outside the scope of this change. The packer's existing validity model will surface this as `invalid`; we do not add a third category.
- **`selectPackingResultsBySpace` returns a record keyed by space ID — what if two spaces share an ID?**: cannot happen by store invariant (spaces have unique IDs by construction), but the contract assumes it. Add a Scenario clarifying the per-space mapping is 1:1.
- **`missing-template` reveals an internal ID to the UI**: acceptable for a developer-facing error banner; if this product later faces end users, the banner becomes a friendly "Selection is no longer valid" message. The `templateId` payload remains on the result for diagnostics.
- **The validity badge becomes the only signal of failure** — if the badge is hidden by overflow or off-screen, the user sees a partial layout looking valid. Mitigation: the badge sits in a fixed corner with `data-testid`; the E2E test asserts visibility.
- **The change forces every caller of `selectPackedLayout` to handle three new branches even if they only care about the result.** This is the point — silent paths become loud — but it does add ceremony. We accept this in exchange for the safety property.
