## MODIFIED Requirements

### Requirement: Cross-System Strategy Comparison

For the active space, the application SHALL show one strategy card per comparable storage system (`schaller`, `gridfinity`, `akromils`, `opengrid`).
Each card SHALL show the space's template packed with only that system's compatible bins, using an unconstrained auto-fill (no user-set minimums or maximums), per the System-Per-Layout Rule.
Each card SHALL present objective metrics only — space utilization percentage, total bin count, and SKU count — with no automatic ranking, scoring, or "best overall" label; the only comparative affordance SHALL be per-metric best-value highlighting.
Bins excluded by the space's installation constraints (e.g. `noDrill`) SHALL be excluded from every card's pack, not only the space's currently-selected system.

Verified by: `apps/web/src/ui/options/OptionsPanel.test.tsx` > "renders exactly one card per comparable system, with no overall-ranking label" AND `packages/store/test/options-mode-strategies.test.ts` > "returns one resolved LayoutResolution per comparable system".

#### Scenario: Four systems render as independent cards

- **WHEN** a user views Options Mode for a space
- **THEN** up to four cards render — one each for Schaller, Gridfinity, Akro-Mils, and OpenGrid — and no card mixes bins from more than one system

#### Scenario: No card is ranked or scored

- **WHEN** the four cards are rendered
- **THEN** no card is labeled "best," "recommended," or given an overall rank; only individual metrics may be highlighted as the best value for that metric across cards

#### Scenario: Installation constraints apply to every card

- **WHEN** the active space's template has a `noDrill` installation constraint
- **THEN** no card's pack includes a bin whose `installation.type` is `"drill"`, regardless of which system that card represents

#### Scenario: A system has no eligible bins for this space

- **WHEN** every bin in a given system is height-ineligible for the space's template (or no bins pass installation filtering)
- **THEN** that system's card renders with zero utilization, zero bin count, and zero SKU count rather than an error

#### Scenario: No active space

- **WHEN** Options Mode is viewed with no active space selected (including the app's first-launch state, before any space has been created)
- **THEN** the application shows an empty state instead of strategy cards, consistent with how the constraint-editing view already handles no active space
