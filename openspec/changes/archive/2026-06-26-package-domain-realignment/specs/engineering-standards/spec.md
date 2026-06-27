## ADDED Requirements

### Requirement: No Cross-Layer Type Name Collisions

The codebase SHALL NOT export the same type name from more than one package in the DAG `geometry → catalog → assembly → packer → store`.
The check applies to exported type aliases and interfaces; Zod schemas (names ending in `Schema`) and branded id types (names ending in `Id`) are exempt because their colocation is intentional and disambiguated by Zod's runtime check.

Verified by: `packages/store/test/package-manifest.test.ts` > "no type name is exported from more than one package".

#### Scenario: Two packages export the same type name

- **WHEN** any two packages in the DAG export a type alias or interface with the same name (excluding `*Schema` and `*Id`)
- **THEN** `bun test packages/store` MUST fail with an assertion that names the colliding symbol and both source packages.

### Requirement: Package Type Ownership Manifest

Each `packages/<pkg>/src/AGENTS.md` SHALL list, under a "Type Ownership" section in a fenced ` ```ts-exports ` block, exactly the set of type aliases and interfaces exported from that package's source.
The list SHALL stay in sync with the package's actual exports via an automated test, so weaker agents can rely on the manifest as authoritative.

Verified by: `packages/store/test/package-manifest.test.ts` > "AGENTS.md ts-exports block matches actual package exports".

#### Scenario: An export is added without updating the manifest

- **WHEN** a new exported type is added to a package's `src/` and the package's `AGENTS.md` ts-exports block is not updated
- **THEN** `bun test packages/store` MUST fail with an assertion that names the missing symbol and the AGENTS.md path that needs editing.

#### Scenario: A manifest lists a type that does not exist

- **WHEN** a package's `AGENTS.md` ts-exports block names a symbol that the package does not export
- **THEN** `bun test packages/store` MUST fail with an assertion that names the stale symbol and the AGENTS.md path that needs editing.
