## ADDED Requirements

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
