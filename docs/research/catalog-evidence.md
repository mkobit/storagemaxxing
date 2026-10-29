# Catalog evidence and next storage system

Research date: 2026-10-29.
Bead: sm-btzi.
Author: Codex, in the assigned isolated workspace.

Recommend IKEA NOJIG as the next named-system research candidate, limited to one loose organizer bin in one verified size.
Prefer a measured custom-bin import slice before a fifth built-in catalog while its product dimensions remain unverified.
Neither recommendation is an implementation approval.
A later OpenSpec change must define the selected behavior and its acceptance tests.

## Scope and evidence rules

This report audits all 131 entries in the four current catalogs: 40 Schaller bins, 13 Akro-Mils bins, 36 Gridfinity bins plus four accessories, and 36 openGrid bins plus two accessories.
The audit compares the source representation with the primary sources that this guest can access.
It does not certify physical fit, installation safety, or every vendor SKU.
No product code, catalog data, or canonical OpenSpec text was changed.

[Product strategy](../../agent_docs/product-strategy.md) favors horizontal breadth and synchronous rectangular fitting.
The [grid accessories contract](../../openspec/specs/grid-accessories/spec.md) requires the existing accessory types and their ordinary rectangle packing and BOM flow.
That contract establishes software behavior; it does not establish that an illustrative accessory is a measured product.
Its references to `packages/catalog/test/` are stale for the accessory tests, which are currently in `packages/catalog/src/`.

Evidence uses these meanings:

- **Source behavior** means a value or rule read from this checkout.
- **Retrieved design evidence** means a statement read from an upstream author's design or documentation, with the source scope stated.
- **Unverified** means the relevant product source was inaccessible or did not provide the value.
- **Conflict** means retrieved evidence describes a different physical model from the current source behavior.

The Schaller, Akro-Mils, IKEA, original Gridfinity video, Gridfinity specification site, and openGrid website requests returned HTTP 403 in this guest.
A failed request does not establish whether a product URL exists or whether a vendor value agrees with the catalog.
GitHub raw files and the GitHub API were accessible.
The report therefore uses retrieved openGrid project documentation and the Gridfinity Rebuilt CAD author's source, while keeping blocked vendor claims unverified.
The guest tracker also failed with `Error: no beads database found`.
The exact task contract came from `.sbx-task/context.txt`; no tracker database was created, imported, written, or synced.

## Sources and retrieval status

| ID  | Source link                                                                                                                                                                                                                                                                                                              | Status and permitted use                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| S1  | [Schaller Corporation](https://www.schallercorporation.com/)                                                                                                                                                                                                                                                             | HTTP 403; primary vendor locator only; no dimensions or installation rules verified.                                          |
| S2  | [Akro-Mils](https://akro-mils.com/) and [AkroBins product locator](https://akro-mils.com/Products/Types/Plastic-Storage-Containers/AkroBins)                                                                                                                                                                             | HTTP 403; exact SKU identity, dimensions, tolerances, and mounting remain unverified.                                         |
| S3  | [Zack Freedman's original Gridfinity video](https://www.youtube.com/watch?v=ra_9zU-mnl8)                                                                                                                                                                                                                                 | HTTP 403; original creator locator, not retrieved evidence.                                                                   |
| S4  | [Gridfinity Rebuilt standard.scad](https://github.com/kennetek/gridfinity-rebuilt-openscad/blob/main/src/core/standard.scad), [bin.scad](https://github.com/kennetek/gridfinity-rebuilt-openscad/blob/main/src/core/bin.scad), and [README](https://github.com/kennetek/gridfinity-rebuilt-openscad/blob/main/README.md) | Raw files retrieved with HTTP 200; primary evidence for this CAD implementation, not certification of all Gridfinity designs. |
| S5  | [Gridfinity specification](https://gridfinity.xyz/specification/)                                                                                                                                                                                                                                                        | HTTP 403; referenced by S4, but not independently read.                                                                       |
| S6  | [openGrid project documentation](https://github.com/openGrid-3D/openGrid-docs/tree/f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1)                                                                                                                                                                                             | HTTP 200 via raw files; retrieved project documentation at the pinned revision.                                               |
| S7  | [IKEA NOJIG search](https://www.ikea.com/us/en/search/?q=NOJIG)                                                                                                                                                                                                                                                          | HTTP 403; candidate family locator only; no article number, size, price, or current availability verified.                    |

S4 was retrieved from the moving `main` branch, and its exact retrieved bytes are saved in the local evidence bundle.
S6 links below use revision `f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1` from the retrieved Git tree.
Failed guessed product and repository locators are retained in the retrieval logs but are not used as product evidence.

## Shared dimension and installation semantics

[BinSpec](../../packages/catalog/src/bin.ts) stores `nominal`, `actual`, and `tolerance` dimensions.
All current catalog lengths use branded inches, including metric systems converted with `mm / 25.4`.
The report uses `w × l × h`; `l` is the footprint depth, and `h` is vertical height.
An axis exchange between width and depth can matter for oriented mounting even if a rectangle packer can rotate a footprint.

[`toPackInput`](../../packages/packer/src/PackInput.ts) copies `actual` dimensions and the per-axis tolerance.
[`getEffectiveFootprint`](../../packages/packer/src/geometryUtils.ts) adds that tolerance once to each actual axis.
The stored tolerance is therefore a positive packing allowance, not a measured symmetric manufacturing interval.
For Gridfinity and openGrid, actual plus tolerance restores the nominal footprint.
For Schaller and Akro-Mils, it does not restore the nominal footprint.
[`binsForDepth`](../../packages/catalog/src/lookup.ts) instead filters on nominal height, so it must not be treated as evidence of measured outer height.

No current built-in entry sets `installation` or `weightLbs`.
The [installation type](../../packages/catalog/src/installationRequirement.ts) can describe drill, rail, adhesive, freestanding, or stack-only requirements, but an absent value does not establish that installation needs no drilling.
The [store installation filter](../../packages/store/src/layoutSelectors.ts) checks explicit drill and rail metadata.
It cannot infer the missing mounting requirements from an accessory name.
Load limits, attachment strength, stacking stability, and clearance for access remain outside this source audit.

## Schaller audit

Source: [catalog assembly](../../packages/catalog/src/schaller.ts) and [data parts 0–7](../../packages/catalog/src/schaller_data/part_0.ts).
All 40 entries are `kind: "bin"` with `catalogSource: "builtin"`.
Their dimensions follow the rules below, with no per-entry measured exceptions.

| Nominal height, in | Nominal footprint sizes, w × l in                                          | Count |
| ------------------ | -------------------------------------------------------------------------- | ----- |
| 1                  | 1×2, 1×3, 1×4, 1×6, 2×2, 2×3, 2×4, 2×6, 3×3, 3×6                           | 10    |
| 2                  | 1×2, 1×3, 1×4, 1×6, 2×2, 2×3, 2×4, 2×6, 3×3, 3×4, 3×6, 3×12, 4×4, 4×6, 6×6 | 15    |
| 3                  | 1×2, 1×3, 1×4, 1×6, 2×2, 2×3, 2×4, 2×6, 3×3, 3×4, 3×6, 3×12, 4×4, 4×6, 6×6 | 15    |

For every entry, actual width and length equal nominal minus 0.1 in.
Actual heights are 1 in, 1.75 in, and 2.75 in for nominal heights of 1 in, 2 in, and 3 in, respectively.
The tolerance is 0.02 in on all three axes.
The effective packed dimensions are therefore nominal width minus 0.08 in, nominal length minus 0.08 in, and actual height plus 0.02 in.
Effective heights are 1.02 in, 1.77 in, and 2.77 in for the three nominal height groups.
For example, `schaller-2x2x3` has nominal 2×3×2 in, actual 1.9×2.9×1.75 in, and effective 1.92×2.92×1.77 in.
The ID orders the nominal height before the footprint; it is not an ordinary w×l×h string.
The `SCH-*` SKU strings have no retrieved vendor crosswalk.

S1 could not verify the 0.1 in reductions, the 0.02 in allowances, or any of the 40 vendor size identities.
The [local PRD, section 5.3](../2026-04-13-PRD.md) claims actual heights of 1.75 in for nominal 2 in and 2.75 in for nominal 3 in.
Those heights agree with the source.
This agreement between internal documents is not independent vendor verification.

Installation is unrecorded for every entry.
Loose drawer placement is the local product concept, but vendor clearance, retaining systems, and stacking rules remain unknown.
No Schaller accessory entries exist in the catalog.
All Schaller prices are marked approximate; current price, article identity, material, color options, and physical tolerances need vendor evidence.

## Akro-Mils audit

Source: [akromils.ts](../../packages/catalog/src/akromils.ts).
All 13 entries are bins, with the following nominal dimensions taken from the source.
The family names in this table are source comments, not independently confirmed vendor classifications.

| Source family | Source SKU | Nominal w × l × h, in  |
| ------------- | ---------- | ---------------------- |
| Stack & Hang  | 30010      | 4 × 4.125 × 3          |
| Stack & Hang  | 30020      | 5.5 × 4.125 × 3        |
| Stack & Hang  | 30030      | 7.375 × 4.125 × 3      |
| Stack & Hang  | 30040      | 10.875 × 5.5 × 5       |
| Stack & Hang  | 30050      | 10.875 × 5.5 × 7       |
| Stack & Hang  | 30060      | 10.875 × 5.5 × 11      |
| Super-Size    | 30120      | 18 × 6 × 9             |
| Super-Size    | 30130      | 18 × 8 × 9             |
| Super-Size    | 30140      | 18 × 12 × 9            |
| Super-Size    | 30150      | 18 × 12 × 12           |
| Divider boxes | 05701      | 11 × 6.375 × 4.125     |
| Divider boxes | 05702      | 11 × 6.375 × 6.375     |
| Divider boxes | 05703      | 17.375 × 6.375 × 6.375 |

Every actual width and length equals nominal minus 0.1 in, with actual height equal to nominal height.
Every tolerance axis is 0.05 in.
Effective packed width and length are therefore nominal minus 0.05 in, and effective packed height is nominal plus 0.05 in.
For `akromils-30010`, those values are actual 3.9×4.025×3 in and effective 3.95×4.075×3.05 in.

S2 could not verify any SKU-to-size mapping, dimension axis order, inside versus outside measurement, or family classification.
The repeated 0.1 in reductions and 0.05 in allowances have no retrieved vendor basis.
They must not be presented as measured manufacturing tolerances or certified external envelopes.
All 13 rows remain unverified against primary product dimensions.

The Stack & Hang name does not specify a compatible rail, mounting hardware, supported load, or permitted number of stacked bins.
Those rules remain unknown, and no entry records installation metadata.
The local PRD's stack-tier suggestions are not primary evidence and are not encoded as catalog installation requirements.
Dividers, labels, lids, and hanging hardware are not separate catalog accessories here; their availability and compatibility need SKU-specific vendor evidence.
Current prices and purchase quantities also remain unverified.

## Gridfinity audit

Source: [gridfinity.ts](../../packages/catalog/src/gridfinity.ts).
The 36 bins are the Cartesian product of nine ordered footprints and four heights.
Footprints in grid units are 1×1, 1×2, 2×1, 2×2, 1×3, 3×1, 2×3, 3×2, and 3×3.
Heights in grid units are 1, 2, 3, and 4.
The source nominal size in millimeters is `(42w) × (42l) × (7h)`.
Actual width and length subtract 0.5 mm once from the full span, not once per grid unit.
Actual height equals nominal height, and tolerance is 0.5×0.5×0 mm.
A 2×2×1 bin is nominal 84×84×7 mm, actual 83.5×83.5×7 mm, and effective 84×84×7 mm.

S4 defines `GRID_DIMENSIONS_MM = [42, 42]`, `BASE_TOP_DIMENSIONS = [41.5, 41.5]`, and `BASE_HEIGHT = 7`.
This supports the 42 mm grid and a 0.5 mm total base gap for that CAD implementation.
Its separate `TOLLERANCE = 0.02` constant is a CAD construction allowance, not the catalog's 0.5 mm fit gap.
Its stacking lip geometry and configurable height modes mean that a 7 mm unit alone does not certify the total outer height of every printable bin.
The Rebuilt README also states that it is a port with small geometry differences from the original design.
The original creator source S3 and specification S5 were inaccessible, so the generated catalog is only partly corroborated.
Printed shrinkage, material, printer calibration, lip inclusion, and exact accessory protrusions remain unknown.

| Accessory ID             | Type    | Source nominal w × l × h, mm |
| ------------------------ | ------- | ---------------------------- |
| `gridfinity-hook-1x1`    | hook    | 42 × 42 × 7                  |
| `gridfinity-label-2x1`   | label   | 84 × 42 × 7                  |
| `gridfinity-divider-1x1` | divider | 42 × 42 × 14                 |
| `gridfinity-blank-1x1`   | blank   | 42 × 42 × 7                  |

The accessory source comment explicitly calls these dimensions illustrative.
No linked model file or creator drawing verifies any of these four envelopes or the `GF-ACC-*` SKU strings.
A hook's projection, a label holder's protrusion, and a divider's installed clearance cannot be derived from grid pitch alone.
The accessory types satisfy the software contract, while physical dimensions remain unverified.

S4 contains magnet and screw-hole options and a configurable stacking lip.
Those are evidence of optional features in that CAD design, not universal installation requirements for every catalog entry.
The built-in catalog does not identify a baseplate or mounting variant.
No entry establishes whether a particular print is freestanding, fixed to a surface, or safe for a load.
The source price of zero does not establish zero printing or purchase cost.

## openGrid audit

Source: [opengrid.ts](../../packages/catalog/src/opengrid.ts).
The source generates the same nine ordered footprints and four heights as Gridfinity, for 36 bins.
Its nominal dimensions are `(28w) × (28l) × (28h)` mm.
It subtracts 3 mm from each actual footprint span and uses tolerance 3×3×0 mm.
A 2×2×1 entry is nominal 56×56×28 mm, actual 53×53×28 mm, and effective 56×56×28 mm.
The source attributes the subtraction to sheet dividers and connectors.

S6's [board guide](https://github.com/openGrid-3D/openGrid-docs/blob/f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1/src/content/docs/guides/board.mdx) describes a wall and desk board ecosystem with a 28×28 mm grid.
It specifies a 6.8 mm full board and a 4 mm light board.
This corroborates grid pitch, but it does not establish a 28 mm bin height unit or a 3 mm bin-envelope subtraction.
The [NeoGrid page](https://github.com/openGrid-3D/openGrid-docs/blob/f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1/src/content/docs/projects/neogrid.mdx) is a short link to a separate drawer-management project and provides no divider dimensions.
The current generated bins therefore mix an unverified divider model with the name of a documented mounting ecosystem.
Do not silently reinterpret these bins as boards or use the retrieved board thicknesses to replace their heights.

The [local PRD, sections 5.6 and 5.7](../2026-04-13-PRD.md) separates a 28 mm divider system from a 75 mm OpenGrid wall system.
Retrieved project documentation instead identifies a 28 mm wall system.
This is a concrete naming and physical-model conflict that a later contract must resolve.
The arithmetic `3 × 28 mm = 2 × 42 mm = 84 mm` is valid and appears in the board guide.
It does not by itself establish mechanical compatibility; the guide notes that shelves can need modification because of border dimensions.

| Accessory ID                   | Type   | Source nominal w × l × h, mm |
| ------------------------------ | ------ | ---------------------------- |
| `opengrid-hook-1x1`            | hook   | 28 × 28 × 28                 |
| `opengrid-accessory-bin-2x2x1` | custom | 56 × 56 × 28                 |

These two entries also use the 3 mm subtraction and are explicitly illustrative in the source.
The [upstream accessory page](https://github.com/openGrid-3D/openGrid-docs/blob/f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1/src/content/docs/guides/accessories.mdx) is work in progress and points to searches rather than dimensioned accessory models.
Neither exact envelope nor either `OG-ACC-*` SKU was verified.
The [snap guide](https://github.com/openGrid-3D/openGrid-docs/blob/f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1/src/content/docs/guides/snaps.mdx) describes mounting, basic, directional, lock, Multiconnect, and screw snaps, plus adapters to other ecosystems.
These are upstream accessory categories, not additional catalog entries.

The board guide specifies direct screw mounting for light boards and mounting tiles for full boards, with screws and anchors as prerequisites.
The [quickstart](https://github.com/openGrid-3D/openGrid-docs/blob/f7be187bdcbc5ee38b8d7ed91db06e0dd8c4a2e1/src/content/docs/guides/quickstart/index.mdx) describes countersunk screws and mounting snaps.
It does not certify a universal adhesive installation or a numerical load rating.
The board guide's suggestion to adjust overly tight printed connectors to about 99.5% is troubleshooting advice, not a general dimensional tolerance for bins.
The catalog has no board variants, snap compatibility, installation metadata, or load evidence for its generated entries.

## Candidate comparison and next-system decision

Candidate: IKEA NOJIG loose organizer bins, with S7 as the vendor discovery source.
The proposed first slice is one rectangular bin for a drawer or shelf, without wall mounting, stacking, or fitted accessories.
That is a proposed scope restriction, not a retrieved vendor promise about the whole family.
The vendor requests were blocked, including attempted US and GB article locators.
An article number and its exact dimensions could not be verified, so no candidate SKU or numeric size is approved for data entry.

| Decision factor      | One built-in NOJIG size                                                                                          | Measured custom-bin import                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Dimensions and units | Needs a verified vendor article, external maximum w/l/h, source units, and conversion to inches.                 | Needs user-supplied external maximum w/l/h with explicit units and validation.                                                     |
| Tolerance            | Vendor manufacturing limits and fit clearance are unknown; zero cannot be assumed to mean measured exactness.    | Must distinguish a user measurement from an explicit positive packing allowance.                                                   |
| Installation         | Limit the proposed slice to loose drawer or shelf placement after confirming the selected article supports it.   | Limit the proposed slice to freestanding rectangles; do not infer mounting safety from absent metadata.                            |
| Accessories          | Exclude from the proposed first slice; accessory availability is unknown.                                        | Exclude from the proposed first slice; avoid pretending imported rectangles define attachment interfaces.                          |
| Data quality         | Reusable vendor identity, but currently blocked by missing primary dimensions and article verification.          | Can represent measured bins without making vendor-wide compatibility claims, but measurement accuracy remains the user's evidence. |
| Contract work        | A fifth named system requires a later decision about the enum, selection, comparison, catalog, and BOM identity. | Existing source tags provide vocabulary, but validation, persistence, lookup, and user flow still need a later contract.           |
| Breadth and effort   | Provides one recognizable system once primary evidence is obtained.                                              | Provides a bounded route for multiple loose-bin brands while using the existing rectangular fitting model.                         |

The [current system enum](../../packages/catalog/src/StorageSystem.ts) includes `custom`, and [catalog source types](../../packages/catalog/src/catalogSource.ts) include `csv_import` and `user_defined`.
Those type members do not establish a working importer.
The source search found no catalog CSV ingestion path; the web CSV code exports BOM data, and sketch import is a separate feature.
The [current lookup](../../packages/catalog/src/lookup.ts) only assembles the four static catalogs.
The [options contract](../../openspec/specs/options-mode/spec.md) names those same four comparison systems.
Custom import must therefore not be described as available today or as a catalog-only change.

Select the measured custom-bin slice as the next bounded implementation proposal, with NOJIG as the first named validation candidate once a size can be verified.
The smallest proposed contract accepts one freestanding rectangular bin with a stable identity, explicit source units, three positive external dimensions, and an explicit non-negative per-axis packing allowance.
It must make that identity resolvable through packing and BOM without changing the existing OpenSpec worker boundary or placing I/O in the pure catalog package.
The subsequent design must decide persistence and input format; CSV support is not assumed by this report.
This gives horizontal breadth without requiring attachment geometry or a new solver.
A built-in NOJIG entry remains deferred until its primary product evidence is available.

Before approving a named-system catalog entry, obtain the vendor article page or drawing and record the maximum outside dimensions, unit system, protrusions, measured height, material, permitted placement, and any stated tolerance.
If the vendor does not publish a tolerance, record it as unknown and use a separately justified planning allowance.
A source-backed physical measurement can supplement the vendor drawing, but this session made no measurements.
For the current catalogs, later work must also resolve openGrid identity, the Schaller external dimensions, the Akro-Mils SKU mappings, and the illustrative accessory envelopes before claiming vendor-verified fit.
Those concerns are reported here for root triage; they are not implemented in this Bead.

## Validation and evidence limits

The baseline catalog tests passed before the report was written.
The required Prettier check and repository-wide `mise run check` results are recorded in `.sbx-task/handoff.md`, with full command output under `.sbx-task/`.
No failing domain tests or product changes were added because this Bead is research only.
A passing test suite validates existing software assertions, not the vendor accuracy of their fixtures.

The local evidence bundle contains `catalog-inventory.json`, retrieved `.source` files, and `fetch-results*.json` under `.sbx-task/evidence/`.
The inventory records every entry and its effective packed dimensions, so the grouped formulas above can be traced to individual entries.
The raw-source files preserve what was read; retrieval manifests preserve HTTP successes and failures.
These task artifacts may not be published with the report, so the public source links and explicit verification limits above are the durable references.
This session could not complete a primary-product dimensional certification for Schaller, Akro-Mils, or NOJIG, or a model-specific envelope certification for the grid accessories.
No unresolved requirement prevents delivery of this limited research report, but those evidence gaps block claims that the affected dimensions are verified.
