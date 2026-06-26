## Purpose

Establish core engineering standards for the repository, focusing on functional programming principles and strict type safety to ensure code quality.

## Requirements

### Requirement: Functional Purity in Logic Packages

All code in `packages/geometry`, `packages/catalog`, and `packages/packer` SHALL be functional and free of side effects.

#### Scenario: Attempting to mutate a variable

- **WHEN** a developer or agent uses `let` or attempts to mutate an object in `packages/packer`
- **THEN** the ESLint check MUST fail with a `functional/no-let` or `functional/immutable-data` error.

### Requirement: Strict Type Safety

All packages SHALL enable `strict: true` in their `tsconfig.json` and MUST NOT use the `any` type.

#### Scenario: Using 'any' in a domain model

- **WHEN** a new interface is defined using `any`
- **THEN** the `bun run typecheck` command MUST fail.

### Requirement: Package Type Ownership Manifest

Each package's `src/AGENTS.md` SHALL contain a fenced `ts-exports` code block listing every symbol exported from the package's source files, one per line, alphabetically sorted.
Names ending in `Schema` (Zod schema convention) are excluded from the cross-layer collision check.

#### Scenario: AGENTS.md export list drifts from source

- **WHEN** a symbol is added to or removed from a package's source files without updating `src/AGENTS.md`
- **THEN** `bun test packages/store` MUST fail with a diff showing the divergence.

#### Scenario: Cross-layer name collision introduced

- **WHEN** a developer exports a non-Schema type name from a package that already exports that name in another package in the DAG
- **THEN** `bun test packages/store` MUST fail identifying the colliding packages.
