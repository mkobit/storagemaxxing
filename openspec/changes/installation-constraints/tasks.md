<!--
  Generated snapshot of the Beads database. Do not hand-edit checkboxes here —
  edit issue state via `bd update`/`bd close` and regenerate this file.
  Source: bd query 'label=meta:openspec:installation-constraints'
-->

## 1. Catalog

- [ ] 1.1 sm-5feh — catalog: add installation field to BinSpec

## 2. Store

- [ ] 2.1 sm-5xj6 — store: add setSpaceDrillable action + isBinInstallationAllowed filter (depends on sm-5feh)

## 3. Web

- [ ] 3.1 sm-l8x4 — web: constraint editor noDrill toggle + Add Bins greying (depends on sm-5xj6)

## 4. Verification

- [ ] 4.1 sm-6tip — web: e2e coverage for noDrill toggle flow (depends on sm-l8x4)
