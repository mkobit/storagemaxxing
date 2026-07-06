<!--
  Generated snapshot of the Beads database. Do not hand-edit checkboxes here —
  edit issue state via `bd update`/`bd close` and regenerate this file.
  Source: bd query 'label=meta:openspec:storage-layout-height-validation'
-->

## 1. Assembly: failure model

- [ ] 1.1 sm-csu4.2 — Extend ConstraintFailure to a discriminated union with heightOverflow variant

## 2. Packer: height eligibility

- [ ] 2.1 sm-csu4.3 — Add isHeightEligible predicate to packer geometryUtils
- [ ] 2.2 sm-csu4.4 — Partition packSpace's availableBins by height eligibility (depends on sm-csu4.3)

## 3. Packer: failure and validity wiring

- [ ] 3.1 sm-csu4.5 — Emit heightOverflow failures from checkHardMinPhase/checkSoftMinPhase (depends on sm-csu4.2, sm-csu4.3)
- [ ] 3.2 sm-csu4.6 — Wire eligibility partition into executePhases validity lattice (depends on sm-csu4.4, sm-csu4.5)

## 4. Verification

- [ ] 4.1 sm-csu4.7 — Add height-validation scenarios to packer golden-path tests (depends on sm-csu4.6)
- [ ] 4.2 sm-csu4.8 — Run full quality gate for storage-layout-height-validation (depends on sm-csu4.7)
