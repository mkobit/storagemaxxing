<!--
  Snapshot of `bd query 'label=meta:openspec:design-token-lint'`.
  Do NOT hand-edit checkboxes here -- update bead status via `bd close <id>` and regenerate this snapshot.
-->

## 1. Fix pre-existing violations (unblock the rule)

- [ ] 1.1 [sm-sbqr](../../../.beads) Delete dead `GridVisualizer.tsx` to unblock design-token lint rule
  - Validation: `rg -l GridVisualizer apps/web` returns no matches; `bun run typecheck` and `bun test` pass.
- [ ] 1.2 [sm-zo8s](../../../.beads) Replace arbitrary Tailwind bracket values with scale utilities in `ConstraintEditorPanel`/`ConstraintInputs`/`ConstraintRow`
  - Validation: `bun run lint` reports zero violations for the five known sites; before/after screenshot of `ConstraintRow` shows no jarring visual regression.

## 2. Add the lint rule

- [ ] 2.1 [sm-vwdk](../../../.beads) Add design-token lint rules (hex-color + arbitrary-bracket) to `eslint.config.ts`, depends on 1.1 and 1.2
  - Validation: `bun run lint` passes with zero violations across `apps/web/src`, including `binColorPalette.ts` (exempted) and the fixed sites from group 1.
