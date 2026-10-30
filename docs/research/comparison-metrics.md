# Comparison metrics and purchase totals

This report records research for sm-v821 at baseline `21c50ad0be05f84777a8031549bb6c6ab57bfdf7`.
The [fixed probes](../../packages/store/src/comparisonProbe.test.ts) call the production selectors and BOM functions with synthetic data.
They record current behavior and do not approve a metric or API change.
Any such change needs later OpenSpec approval.

## Contract and sources

The [options mode contract](../../openspec/specs/options-mode/spec.md#requirement-cross-system-strategy-comparison) requires independent system cards with utilization, total bin count, and SKU count.
It prohibits automatic ranking, scores, recommendations, and a best overall label.
Only a best value for an individual metric can be highlighted.
The [accessory contract](../../openspec/specs/grid-accessories/spec.md#requirement-accessories-flow-through-the-existing-packing-and-bom-pipeline-unchanged) requires accessories to use the same rectangle placement and BOM price rules as bins.

The [selectors](../../packages/store/src/layoutSelectors.ts) filter by system and installation requirements but do not filter by `kind`.
The [packer adapter](../../packages/packer/src/PackInput.ts) passes actual dimensions and tolerance to the packer.
The [packer](../../packages/packer/src/packer.ts) divides total effective footprint area by effective space area.
The [geometry functions](../../packages/packer/src/geometryUtils.ts) add tolerance to actual dimensions and resolve space dimensions for each access face.
The [card metric function](../../apps/web/src/ui/options/toCardMetrics.ts) sums all placed counts and counts positive ID entries.
The [card](../../apps/web/src/ui/options/StrategyCard.tsx) labels those values “Bins” and “SKUs”.
The [options panel](../../apps/web/src/ui/options/OptionsPanel.tsx) highlights the maximum of each metric, including SKU count, with ties allowed.
The [BOM functions](../../packages/assembly/src/bom.ts) derive line quantities from placed counts and multiply aggregate quantities by `space.count`.
The [BOM type](../../packages/assembly/src/BaseTypes.ts) has item IDs, quantities, a total price, and one approximate flag.
It has no currency, unknown price count, purchase pack size, or support dependency field.

## Fixed cases and actual outputs

All dimensions below use inches.
The template is a 4 × 4 × 2 top access drawer with no installation constraints.
Each ordinary item is 2 × 2 × 1 with zero tolerance unless a case states otherwise.
The fixture uses a Schaller bin priced at 3, an Akro-Mils bin with no price, a Gridfinity hook priced at 2, a Gridfinity bin with height 3, and an OpenGrid rail bin priced at 5.
Prices are synthetic numeric values and do not establish a currency or market price.

### Independent options previews

| System     | Actual placed counts | Occupied area | Card count derivation | Positive IDs | BOM total | Approximate |
| ---------- | -------------------- | ------------- | --------------------- | ------------ | --------- | ----------- |
| Schaller   | Priced bin: 4        | 100%          | 4                     | 1            | 12        | false       |
| Gridfinity | Hook: 4              | 100%          | 4                     | 1            | 8         | false       |
| Akro-Mils  | Unknown price bin: 4 | 100%          | 4                     | 1            | 0         | true        |
| OpenGrid   | None                 | 0%            | 0                     | 0            | 0         | false       |

These are actual selector and BOM outputs asserted by the probes.
The card columns apply the linked card function to those outputs by inspection; the store test does not import the web package.
The tall Gridfinity bin has no placement.
The rail bin is excluded because the template has no `railPresent` flag.
The accessory fills the Gridfinity preview without a container.
Thus a count of four can mean four hooks rather than four storage containers.
An empty BOM has a zero total and a false approximate flag.

### Mixed placements and repeated spaces

The configured case requires exactly one priced bin and one hook.
`selectPackedLayout` returns counts `{ "priced-bin": 1, "hook": 1 }` and utilization `0.5`.
The BOM contains two lines with quantity 1 each, total 5, and approximate flag false.
This layout has one container and one accessory, while the card count derivation gives 2.
`selectPackingResultsBySpace` returns the same layout for a space with count 3.
`computeAggregateBom` returns quantities 3 and 3, total 15, and approximate flag false.
The preview metrics describe one template layout; the aggregate BOM describes six physical items across three copies.
The aggregate function also has a stored placement fallback when no packing result exists, as covered by the [existing BOM tests](../../packages/assembly/src/bom.test.ts).
This probe uses resolved selector results rather than that fallback.

### Unknown and zero prices

| Input counts or price case                    | Actual total | Approximate | Line behavior                 |
| --------------------------------------------- | ------------ | ----------- | ----------------------------- |
| Two priced bins at 3                          | 6            | false       | Quantity 2 remains            |
| Two bins with explicit price 0                | 0            | true        | Quantity 2 remains            |
| Two bins at 3 with `priceApproximate: true`   | 6            | true        | Quantity 2 remains            |
| Two items with an ID absent from the lookup   | 0            | true        | Unknown ID remains            |
| Two priced bins, three unknown bins, one hook | 8            | true        | All three positive lines stay |

A missing price contributes zero to the sum.
An absent catalog entry also contributes zero and keeps its positive quantity.
An explicit zero price is always marked approximate, even without an approximate flag.
The total is a sum of available prices, so the mixed total of 8 is not evidence of a complete purchase cost.
The single flag does not distinguish a known free item, an unknown price, an absent lookup entry, or an estimated price.
The [BOM summary](../../apps/web/src/ui/bom/BOMSummary.tsx) displays “Total Estimated Cost” and explains the flag as approximate or missing prices.
No price comparison exists on the current options cards.

### Support parts and occupied area

A synthetic Gridfinity support plate has `kind: "accessory"`, type `blank`, dimensions 4 × 4 × 0.25, and price 7.
When the plate is added to the preview catalog, the actual Gridfinity result contains one plate, no hooks, utilization 1, and BOM total 7 with approximate flag false.
The plate competes for the same plane as the containers and accessories.
The pipeline does not place it beneath a container or derive it as a required support purchase.
This uses an existing accessory representation; it does not introduce a support part schema.
The real [Gridfinity catalog](../../packages/catalog/src/gridfinity.ts) also contains a blank baseplate accessory.
Its name alone does not establish dependency or layer behavior.

When `railPresent` is set, the OpenGrid result contains four rail bins with BOM total 20 and approximate flag false.
It adds no rail purchase line.
The [installation contract](../../openspec/specs/installation-constraints/spec.md) treats the flag as an installed rail condition.
The probe does not imply that a new rail must be bought in that case.
There is no automatic support quantity derivation in the selectors or BOM functions.

With tolerance 0.5 in each horizontal dimension, one 2 × 2 bin occupies an effective 2.5 × 2.5 rectangle.
The actual result is one placed bin and utilization `6.25 / 16`, or 39.0625%.
The actual outer bin footprint is only 4 square inches, or 25% of the drawer.
Neither value measures usable interior volume.
The [catalog type](../../packages/catalog/src/bin.ts) contains outer dimensions but no interior capacity field.
The tests establish these results for a rectangular top access drawer only.
They do not establish equivalent physical area semantics for wall, front access, or irregular spaces.

## Confirmed defects and limits

The confirmed metric defect is that the card label “Bins” includes accessories.
The accessory-only preview has zero containers but derives a displayed bin count of four.
This conflicts with the total bin count wording in the options contract when read with the accessory discriminant.
The defect is in the meaning of the count; accessory placement and accessory BOM inclusion follow the accessory contract.
The correct resolution still needs a product decision and OpenSpec approval because the two contracts must remain consistent.

SKU count currently measures positive placed IDs, without reading the catalog `sku` field.
Whether two IDs with the same vendor SKU must merge is a product decision; these fixtures have unique SKUs and do not prove that defect in live data.
The maximum SKU highlight is current behavior, but the contract does not define whether more or fewer SKUs is preferable.
Unknown prices and support omissions are confirmed limits of current totals, not proven violations of either cited contract.
Neither contract requires a complete installed purchase list or a separate unknown price state.
The probes do not establish real prices, internal capacity, purchase pack quantities, or a globally optimal pack.

## Proposed metric decisions for later approval

| Concept              | Proposed decision                                                                                            | Reason from evidence                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Container count      | Count only placed entries with `kind: "bin"`; show accessory count separately                                | Four hooks currently appear as four bins              |
| Occupied area        | Name the metric as effective footprint occupancy and state that tolerance is included                        | The tolerant bin reports 39.0625%, not 25%            |
| Container capacity   | Defer usable volume until catalog evidence provides interior dimensions or a measured capacity               | Outer dimensions do not supply interior capacity      |
| SKU count            | Define whether the key is a catalog ID or a vendor and SKU pair before changing the API                      | Current counting reads positive IDs                   |
| SKU highlighting     | Obtain a product decision on direction or omit highlighting until approved                                   | The current maximum is not a defined purchase benefit |
| Price completeness   | Separate the known price subtotal from missing, zero, and estimated price states                             | The same flag covers all these cases                  |
| Purchase quantities  | Keep per-layout counts distinct from aggregate physical quantities and any future pack rounding              | Three copies multiply the two layout items to six     |
| Support requirements | Define support dependencies, installed inventory, shared quantities, and layer rules before extending totals | A plate consumes the plane; a rail flag adds no line  |

These proposals do not change the canonical specs or current API.
Keep each approved metric objective and explain its scope.
Preserve the no-ranking rule in all later work.
Do not combine occupancy, container count, price, or purchase needs into a score or recommendation.
