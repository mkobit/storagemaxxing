<!--
  Generated snapshot of `bd query 'label=meta:openspec:add-opengrid-options-mode'`.
  Do not hand-edit; task state lives in Beads. Re-run the query to refresh this file.
-->

## 1. Store layer

- [ ] 1.1 sm-qamn — Widen COMPARABLE_SYSTEMS to include opengrid in layoutSelectors (scope:store)

## 2. Web layer

- [ ] 2.1 sm-t080 — Add opengrid card to OptionsPanel and StrategyCard in apps/web (scope:apps/web, depends on sm-qamn)
- [ ] 2.2 sm-ougp — Update OptionsPanel.test.tsx for 4-way comparison and verify UI in browser (scope:apps/web, depends on sm-t080)
