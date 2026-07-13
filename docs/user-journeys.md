# User journeys

## Status

This document is the output of the sm-vj2v discovery session (facilitated, human + agent).
It replaces guesswork with a documented role, traits, and 5 concrete journeys.
Each journey is grounded in the actual codebase, not the deprecated `docs/2026-04-13-PRD.md` persona set.
Each journey below has exactly one child bead, linked `discovered-from` sm-vj2v, that produces an e2e test and/or a scoped usability fix.

Scenario format follows the existing openspec convention (see `openspec/specs/drawer-space-manager/spec.md`).
Each Scenario maps 1:1 by name to a Playwright test in `apps/web/e2e/`, by naming convention, not by an automated runner.

## Role

**Space planner.**
Spans a newbie with a new 3D printer through a heavy fabricator with a large backlog of parts.
Plans drawer and cabinet storage, and may mix 3D-printed bins with off-the-shelf bins.

A separate "shop worker" role was considered and dropped.
Its distinguishing need — pegboard and wall-mounted storage — has no representation anywhere in `packages/catalog` or `openspec/specs` today.
Its other need, multiple toolboxes of different sizes, already collapses into the space planner role: it is just multiple differently-sized spaces.

## Traits

Traits modulate the space planner role.
They are not separate roles.

- Budget or bargain conscious.
- Completionist: plans across a whole home or shop, not one space.
- System comparer: has not committed to one storage system yet.
- Fast iterator: low tolerance for a first-fit result, wants to tweak and see the update immediately.
- Backlog scale: newbie versus established or heavy fabricator.

A "hacker" role was considered and demoted to the fast-iterator trait above.
Nothing in the code or specs distinguishes it from a space planner doing the same constraint-editing loop.

## Job statement

When I have empty or messy drawers and cabinets to organize, I want to plan and fill them with bins, possibly mixing 3D-printed and off-the-shelf, so I can avoid buying bins that do not fit.

"Avoid overspending" was considered and dropped from this statement.
No price or cost field exists anywhere in `packages/catalog/src` today, so a cost claim is not testable.

## Journeys

### 1. Plan a single drawer before buying bins

Core job, no trait required.

**Requirement:** A space planner SHALL be able to define one drawer, select a system, add bins by constraint, and see whether everything they wanted fits before buying anything.

#### Scenario: Workshop drawer planning

- **WHEN** the user creates a space with real drawer dimensions, picks a system, and sets hard-min counts for the bins they want
- **THEN** the layout packs and the validity badge tells them plainly whether every bin they wanted actually fit

**Grounded in:** `apps/web/src/ui/GoldenPathSetup.tsx`, `apps/web/e2e/golden-path.spec.ts`.
**Currently:** Fully supported. This is the existing golden-path flow, reframed as a real narrative instead of a synthetic CI fixture.
**Bead:** sm-ul0p.

### 2. Plan a whole tool chest and get one shopping list

Trait: completionist.

**Requirement:** A space planner SHALL be able to create multiple spaces, assign bins to each, and see one combined bill of materials across all of them.

#### Scenario: Multi-drawer BOM export

- **WHEN** the user creates two or more spaces with different bin selections and opens the BOM panel
- **THEN** the BOM shows correct aggregated quantities per bin type across every space

**Grounded in:** `apps/web/e2e/space-manager.spec.ts` (multi-space), `apps/web/src/ui/BOMPanel.tsx` and `computeAggregateBom` in `packages/assembly/src/bom.ts` (aggregate BOM), `apps/web/e2e/bom-panel.spec.ts`.
**Currently:** Mostly built. Multi-space and BOM both exist and are tested separately; no e2e test exercises them together as one journey.
**Bead:** sm-ez18.

### 3. Try a different bin system in a space

Trait: system comparer.

**Requirement:** A space planner SHALL be able to pick Akro-Mils or Schaller, not just Gridfinity, for a space and get constraint editing and packing equivalent to the Gridfinity path.

#### Scenario: Akro-Mils bin selection

- **WHEN** the user creates a space with system "akromils" and adds Akro-Mils bin SKUs as constraints
- **THEN** the layout packs using Akro-Mils actual and tolerance dimensions and the validity badge updates accordingly

**Grounded in:** `packages/catalog/src/akromils.ts`, `packages/catalog/src/schaller.ts`, `apps/web/src/ui/ConstraintEditorPanel.tsx` (existing akromils and schaller branching).
**Currently:** Catalog data and system selection exist. No e2e test confirms the constraint editor and packer work end to end for these systems; the golden-path suite only covers Gridfinity.
**Bead:** sm-s53j.

### 4. Tweak a constraint and see it update immediately

Trait: fast iterator.

**Requirement:** A space planner SHALL be able to change a bin choice or constraint on an already-packed space and see the layout and validity update without redoing setup.

#### Scenario: Constraint edit refreshes an existing layout

- **WHEN** the user changes a constraint's mode, count, or bin choice on a space that already has a layout
- **THEN** the canvas and validity badge update to reflect the new constraint immediately

**Grounded in:** `openspec/specs/interactive-constraint-editing/spec.md`, the mode-toggle test in `apps/web/e2e/golden-path.spec.ts` ("changing a constraint's mode refreshes the validity badge"), and the count-change and bin-swap tests in `apps/web/e2e/constraint-edit-refresh.spec.ts`.
**Currently:** Fully covered. All three edit types named in the scenario — mode, count, and bin choice — have an e2e test against an already-packed space.
**Bead:** sm-4857.

### 5. Resume a plan later

Trait: backlog scale (continuity matters more the more you have invested).

**Requirement:** A space planner SHALL be able to leave and return, on the same device or a different one via export and import, and find their spaces and constraints exactly as they left them.

#### Scenario: Multi-space sketch persists and round-trips

- **WHEN** the user reloads the page, or exports a sketch and imports it elsewhere
- **THEN** all spaces, constraints, and the packed layout are restored exactly

**Grounded in:** `openspec/specs/local-persistence/spec.md`, `openspec/specs/state-serialization/spec.md`, the existing reload and export-import tests in `apps/web/e2e/golden-path.spec.ts`.
**Currently:** Implemented and tested against the single-space golden-path fixture. Not yet tested against a real multi-space plan.
**Bead:** sm-5pjs.

## Dropped from scope

Pegboard and wall-mounted storage planning.
Considered under the shop-worker role during discovery.
No pegboard, hook, wall-mount, or toolbox catalog concept exists anywhere in `packages/catalog/src` or `openspec/specs` today.
Revisit if wall-mounted systems (for example OpenGrid accessories) are added to the catalog.
