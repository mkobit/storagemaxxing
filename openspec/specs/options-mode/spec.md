# options-mode Specification

## Purpose
TBD - created by archiving change options-mode. Update Purpose after archive.
## Requirements
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

### Requirement: Strategy Selection Commits System and Constraints

The application SHALL let a user commit a previewed strategy to the active space via a "Select & Customize" action on that strategy's card.
Committing a strategy SHALL set the space's system to the selected system and SHALL replace the space's constraints with the same unconstrained auto-fill constraint set shown in the preview.
After committing, the application SHALL transition the user into the existing constraint-editing view for that space.

#### Scenario: Selecting a strategy sets the space's system

- **WHEN** a user selects "Select & Customize" on the Gridfinity card
- **THEN** the active space's system becomes `"gridfinity"`

#### Scenario: Selecting a strategy seeds constraints from the preview

- **WHEN** a user selects "Select & Customize" on a card
- **THEN** the space's constraints become the unconstrained auto-fill set for that card's system and bins — one auto-mode constraint per compatible bin, matching what the card previewed

#### Scenario: Selecting a strategy hands off to Configure Mode

- **WHEN** a user completes "Select & Customize"
- **THEN** the application shows the constraint-editing view for the space, reflecting the newly-applied system and constraints

#### Scenario: Committing a strategy replaces constraints for every space sharing the template

- **WHEN** a user commits a strategy for a space whose template is shared by other space instances
- **THEN** every space sharing that template has its constraints replaced with the new auto-fill set, matching how every other constraint edit in the app already propagates across sibling instances on a shared template — this is expected behavior, not a defect, and any in-progress unsaved edits on a sibling space are discarded

