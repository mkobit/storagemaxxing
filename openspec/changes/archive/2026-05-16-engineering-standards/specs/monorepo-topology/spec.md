## ADDED Requirements

### Requirement: Directed Acyclic Dependency Graph

The monorepo dependency graph SHALL remain acyclic and follow a clear hierarchy: Geometry -> Catalog -> Packer/Solver -> Web App.

#### Scenario: Circular dependency check

- **WHEN** `packages/geometry` attempts to import from `packages/packer`
- **THEN** the ESLint `import/no-cycle` rule or a custom build script MUST fail the build.

### Requirement: Package Responsibility Boundaries

Each package SHALL have a single, well-defined responsibility.

- **Geometry**: Primitives only.
- **Catalog**: Domain models and vendor data.
- **Packer**: Synchronous layout logic.
- **Solver**: Asynchronous constraint validation.

#### Scenario: Logic leak

- **WHEN** React state management logic is added to `packages/packer`
- **THEN** it SHALL be flagged during code review as a violation of the `monorepo-topology` spec.
