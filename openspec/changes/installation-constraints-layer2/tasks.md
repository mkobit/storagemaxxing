# Tasks: Installation Constraints (maxWeightLbs & railPresent)

- [ ] 1. Catalog weight support (`packages/catalog`)
  - Add optional `weightLbs?: number` to `BinSpec` and `BinSpecSchema`.
  - Validation: `bun test packages/catalog`

- [ ] 2. Assembly weight overflow failure schema (`packages/assembly`)
  - Add `WeightOverflowFailure` to `ConstraintFailure` union and export `createWeightOverflowFailure`.
  - Validation: `bun test packages/assembly`

- [ ] 3. Store selector filtering & layout resolution (`packages/store`)
  - Update `resolveSpace` to require `railPresent` for `rail`-type bins.
  - Implement post-pack aggregate weight computation against `maxWeightLbs`.
  - Validation: `bun test packages/store`

- [ ] 4. Web UI constraint controls (`apps/web`)
  - Surface `railPresent` toggle and `maxWeightLbs` input in constraint editor panel.
  - Validation: `bun run typecheck` and `bun run screenshot`
