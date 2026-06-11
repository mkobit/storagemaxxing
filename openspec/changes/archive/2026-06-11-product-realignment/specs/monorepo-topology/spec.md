# monorepo-topology Specification (Delta)

## MODIFIED Requirements

### Requirement: Directed Acyclic Dependency Graph

The monorepo dependency graph SHALL remain acyclic and follow the hierarchy `geometry → catalog → assembly → packer → store → web`, enforced by lint rules rather than convention.
Each package MAY import only from `@storagemaxxing/*` packages strictly below it in the hierarchy.

#### Scenario: Upward import fails lint

- **WHEN** `packages/geometry` source imports from `@storagemaxxing/packer`
- **THEN** `bun run lint` MUST fail with a restricted-import violation.

#### Scenario: Lateral import fails lint

- **WHEN** `packages/catalog` source imports from `@storagemaxxing/store`
- **THEN** `bun run lint` MUST fail with a restricted-import violation.

### Requirement: Package Responsibility Boundaries

Each package SHALL have a single, well-defined responsibility, and the workspace SHALL contain only packages on the golden path.

- **geometry**: spatial primitives only.
- **catalog**: storage systems, vendor data, and bin specifications.
- **assembly**: domain model (sketches, features, constraints, BOM) with Zod schemas.
- **packer**: synchronous 2D layout logic (pure functions).
- **store**: application state and pure layout derivation.
- **web**: rendering and interaction.

#### Scenario: Logic leak

- **WHEN** React state management logic is added to `packages/packer`
- **THEN** it SHALL be flagged during code review as a violation of the `monorepo-topology` spec.

#### Scenario: Placeholder package

- **WHEN** a package exists in `packages/` with no source files or no consumers
- **THEN** it SHALL be deleted or given a spec-backed purpose before new work targets it.
