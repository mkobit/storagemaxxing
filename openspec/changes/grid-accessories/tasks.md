<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Catalog: BinSpec kind discriminant (foundation)

- [x] 1.1 [sm-t0rs](../../../.beads) Add `kind`/`accessoryType` discriminant to `BinSpec` across all catalog files
  - Validation: `bun run typecheck`
- [x] 1.2 [sm-denu](../../../.beads) Update packages/catalog BinSpec fixtures for new `kind` field
  - Validation: `bun test packages/catalog`
- [x] 1.3 [sm-ws7v](../../../.beads) Update packages/assembly BinSpec fixtures for new `kind` field
  - Validation: `bun test packages/assembly`
- [x] 1.4 [sm-1nc3](../../../.beads) Update packages/store BinSpec fixtures for new `kind` field
  - Validation: `bun test packages/store`
- [x] 1.5 [sm-igme](../../../.beads) Update apps/web BinSpec fixtures for new `kind` field
  - Validation: `bun test apps/web`
- [x] 1.6 [sm-ao3o](../../../.beads) Enforce `accessoryType` for `kind: "accessory"` at the `BinSpec` type boundary
  - Validation: `bun test packages/catalog && bun run typecheck && bun run lint`

## 2. Catalog: accessory data

- [x] 2.1 [sm-gkdi](../../../.beads) Add Gridfinity accessory catalog data (hook, label, divider, blank)
  - Validation: `bun test packages/catalog`
- [x] 2.2 [sm-sioj](../../../.beads) Add OpenGrid accessory catalog data (hook, accessory bin)
  - Validation: `bun test packages/catalog`
- [x] 2.3 [sm-z717](../../../.beads) Lookup test: accessories resolve via `ALL_BINS`/`findBinById` alongside bins
  - Validation: `bun test packages/catalog`

## 3. Packer/Assembly: pipeline regression coverage

- [x] 3.1 [sm-uxrv](../../../.beads) Packer test: accessory entries pack without overlap (no packer code changes)
  - Validation: `bun test packages/packer`
- [x] 3.2 [sm-gnpi](../../../.beads) Assembly test: BOM includes accessory line items priced like bins
  - Validation: `bun test packages/assembly`

## 4. Web UI

- [x] 4.1 [sm-ld2b](../../../.beads) ConstraintEditorPanel: add "Add Accessories" section
  - Validation: `bun test apps/web`
- [x] 4.2 [sm-juj2](../../../.beads) BOM UI: visually distinguish accessory line items
  - Validation: `bun test apps/web`

## 5. Docs & optional polish

- [ ] 5.1 [sm-jw34](../../../.beads) Fix PRD: OpenGrid is a 28mm panel system, not 75mm
  - Validation: `rg -n "75mm" docs/2026-04-13-PRD.md` (no OpenGrid match)
- [ ] 5.2 [sm-21p5](../../../.beads) (Optional) Visual differentiation for placed accessories in LayoutCanvas
  - Validation: `bun test apps/web` + manual dev-server check
