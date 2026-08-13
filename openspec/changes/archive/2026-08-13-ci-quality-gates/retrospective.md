# Retrospective: ci-quality-gates

## §0 Evidence

- **Commit Range**: sm-wghm..main (including PR #358 and sm-rs0c child tasks)
- **Tasks Completed**: 15/16 tasks completed in `tasks.md` (all implementation and flip tasks closed; 1 task `sm-jb1j` time-deferred for 1-week main CI observation)
- **Beads Closed**: sm-oxc3, sm-xsqx, sm-y22j, sm-dgbl, sm-7nnk, sm-8x0r, sm-jtpt, sm-uwu6, sm-shlm, sm-kkic, sm-7bz6, sm-x41r, sm-jiqu, sm-c1su, sm-m0ar, sm-jrr8, sm-3rhz, sm-timr, sm-e2jn, sm-1631
- **Test Status**: 162/162 package/hook unit tests passing, 79/79 apps/web unit tests passing

## §1 Wins

- Integrated full-spectrum dead-code detection (`knip`) across all monorepo packages and apps/web, clearing a 63-item backlog of unused exports, types, and devDependencies.
- Decoupled advisory coverage-threshold checking into a dedicated CI script (`scripts/check-coverage-threshold.ts`), keeping test failures cleanly separated from coverage metric checks.
- Standardized `eslint-disable` comment hygiene by registering `@eslint-community/eslint-plugin-eslint-comments` (`no-unlimited-disable` and `require-description`) and adding explicit `--` rationale comments across all packages.
- Successfully promoted knip and eslint-comments hygiene gates from advisory to blocking.

## §2 Misses

- Per-package (vs. per-invocation) coverage threshold enforcement could not be achieved directly in `bunfig.toml` due to Bun test runner aggregate reporting constraints, retaining total-invocation threshold checks.

## §3 Surprises

- Live knip analysis during scoping uncovered 63 unused items across 6 distinct package scopes, prompting a split of `sm-dgbl` into 6 single-package subtasks to honor bead scoping contracts.
- Dead-code analysis exposed dangling `tsconfig.json` path aliases for deleted barrel files in geometry/catalog/assembly (filed separately as `sm-620t`).

## §4 Promote

- [ ] Maintain `knip.json` entry scripts and ignore lists whenever adding CLI scripts, Vite aliases, or dynamic entry points to preserve zero false positives.
