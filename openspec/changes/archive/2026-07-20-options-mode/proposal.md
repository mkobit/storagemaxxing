## Why

`apps/web/src/ui/options/` is an empty scaffold (`.gitkeep` only) with no OpenSpec spec covering it, yet Options Mode is the product's stated core UX differentiator.
PRD §8 defines it as the core loop — define a space, see what different systems look like in it, pick one, then configure — and `docs/jules/product.md` principle #1 makes "Describe your space → See possibilities" the primary entry point, never a blank canvas.
Comparable tools (gridfinitylayouttool.com, gridfinitystudio.com, andymai/gridfinity-layout-tool) are all single-system only; cross-system comparison of the same space is the gap StorageMaxxing exists to fill, and today the app cannot show it at all.
The PRD's §8.2 vision assumes a GLPK.js constraint solver ("Layer 2") that does not exist — per `AGENTS.md` the engine is Layer 1 only: synchronous 2D geometric fitting in `packages/packer`.
Everything Options Mode actually needs for a first cut already exists: three systems (Schaller, Gridfinity, Akro-Mils) pack end-to-end, `PackingResult.metrics` carries `areaUtilization` and `placedCounts`, and filtering the catalog by system is an established one-line pattern (`ConstraintEditorPanel.tsx` line 58).
This change scopes a Layer-1-only Options Mode so the differentiator ships without waiting on a solver.

## What Changes

- `apps/web`: implement Options Mode in `apps/web/src/ui/options/` as a card ("pillar") comparison view — one strategy card per comparable system (`schaller`, `gridfinity`, `akromils`), each showing the same active space packed with only that system's bins, per the System-Per-Layout Rule (PRD §8.1): no cross-system mixing within a card.
- Each card presents one metrics block with objective metrics only — space utilization %, total bin count, and SKU count — all derivable today from `PackingResult` (`metrics.areaUtilization`, `metrics.placedCounts`). No ranking, scoring, or recommendation: per product principle #5 ("Validity Over Optimal") the tool proves options and the user decides.
- A highlight-best-value affordance marks the best value per metric across cards (an objective fact, not a crowned winner).
- Each card carries the two actions named in PRD §8.2's mockup: "View Layout" (preview the packed layout) and "Select & Customize" (set the space's system and hand off to the existing constraint-editing flow).
- Layout: at most 3 cards side-by-side on desktop (one per real system), collapsing to stacked cards on narrow viewports.
- Installation constraints are respected: a space with `noDrill` excludes drill-requiring bins from every card's pack, reusing the shipped `installation-constraints` filtering.
- **Open technical question for design.md (not resolved here):** how a per-system "unconstrained auto-fill" pack is generated. Today `resolveSpace` in `packages/store/src/layoutSelectors.ts` packs only against the space's explicit constraint list for its current system; there is no path that runs an unconstrained fill of every compatible SKU from a given system. Whether this is a new store selector, a reuse of `resolveSpace` with a synthesized all-`auto` (zero-minimum) constraint set riding the packer's existing `autoFill` phase, or something else is a design decision that must be settled in design.md before implementation.
- Explicitly deferred to follow-on changes:
  - **Cost metric.** Akro-Mils and Schaller SKUs carry real catalog prices, but every Gridfinity SKU is a `price: 0` placeholder (`packages/catalog/src/gridfinity.ts`), so a cost column today would be accurate for two systems and misleading for the third. Populating Gridfinity pricing (or a print-cost model) is its own change; this proposal does not block on it and does not include it.
  - **"Fewer large" per-system variants** (PRD §8.2 step 2) — variant generation multiplies packs and card count; first cut is one card per system.
  - **Constrained strategy generation** (respecting user-set hard minimums and filling the remainder, PRD §8.2) — this is the solver-shaped half of the vision and belongs with the deferred Layer 2.
  - **Storage-category checklist** (PRD §8.4) — depends on StorageCategories, which have no implementation.
  - `opengrid` and `custom` `StorageSystem` values — `opengrid` is a dead enum value with no catalog (tracked in sm-qrai) and `custom` is not a comparable purchasable system; neither gets a card.

## Capabilities

### New Capabilities

- `options-mode`: for the active space, the user sees one strategy card per comparable storage system, each packed with only that system's compatible bins, presenting objective metrics (utilization %, bin count, SKU count) with no ranking, and can select a card to set the space's system and continue into the existing constraint-editing flow.

### Modified Capabilities

(none — existing packing, constraint-editing, and installation-constraints behavior is unchanged; Options Mode composes over it as a new read path plus the already-shipped system-selection write path)

## Impact

- Affected: `apps/web` (the `ui/options/` view, its route/entry wiring, and card components). Depending on the design.md decision on auto-fill generation, `packages/store` may gain a selector; no other package changes, no new packages, and no new DAG edges (`geometry → catalog → assembly → packer → store → web` respected — the web app already legally imports store and catalog).
- Not affected: `packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer`.
- No persistence changes: Options Mode is a derived view over existing `SpaceTemplate` and space state; selecting a card writes through the existing space-system field.
- Performance stays synchronous: three MaxRects packs per space render, all pure Layer 1 functions — no workers, no async validation layer.

## Success Criteria

- With a space defined and no constraints set, the user sees up to three strategy cards — Schaller, Gridfinity, Akro-Mils — each showing that system alone packed into the same space, with utilization %, bin count, and SKU count per card.
- No card ever mixes systems, and no card is labeled or ordered as "best," "recommended," or ranked; the only comparative affordance is per-metric best-value highlighting.
- On a space with `noDrill` set, no card's layout or metrics include a drill-requiring bin.
- "Select & Customize" on a card sets the space's system and lands the user in the existing constraint-editing flow scoped to that system's catalog.
- Cards render side-by-side on desktop and stack on narrow viewports.
- design.md (a follow-on artifact, out of scope here) resolves the unconstrained auto-fill generation mechanism before any implementation bead is claimed.
- `bun run lint`, `bun run typecheck`, and `bun test` pass with changes confined to `apps/web` (plus `packages/store` only if design.md lands the selector there).
