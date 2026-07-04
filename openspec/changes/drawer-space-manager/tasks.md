<!--
  Generated snapshot of the Beads database. Do not hand-edit checkboxes here —
  edit issue state via `bd update`/`bd close` and regenerate this file.
  Source: bd query 'label=meta:openspec:drawer-space-manager'
-->

## 1. Validation

- [ ] 1.1 sm-yl17 — Add CreateSpaceInputSchema for space-manager form validation

## 2. Components

- [ ] 2.1 sm-i6tg — Build create-space form component wired to store (depends on sm-yl17)
- [ ] 2.2 sm-ejk6 — Build space list/switcher UI

## 3. Integration

- [ ] 3.1 sm-4w8h — Wire space-manager panel into Toolbar (depends on sm-i6tg, sm-ejk6)

## 4. Verification

- [ ] 4.1 sm-k81y — E2E coverage: create-space and switch-space flows (depends on sm-4w8h)
