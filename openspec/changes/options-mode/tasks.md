<!--
  Generated snapshot of the Beads database. Do not hand-edit checkboxes here —
  edit issue state via `bd update`/`bd close` and regenerate this file.
  Source: bd query 'label=meta:openspec:options-mode'
-->

## 1. Store

- [ ] 1.1 sm-oukg — store: add selectOptionsModeStrategies preview selector
- [ ] 1.2 sm-7387 — store: add applySpaceStrategy action to commit a strategy (depends on sm-oukg)

## 2. Web

- [ ] 2.1 sm-sstq — web: OptionsPanel card grid + App.tsx options tab (depends on sm-oukg, sm-7387)

## 3. Verification

- [ ] 3.1 sm-8bf4 — web: e2e coverage for options-mode strategy selection flow (depends on sm-sstq)
