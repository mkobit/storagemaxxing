## ADDED Requirements

### Requirement: Task List Compatibility
The OpenSpec `tasks.md` format SHALL be strictly compatible with the `bd create --file` command to enable automated batch creation.

#### Scenario: Validating task list format
- **WHEN** an agent runs `bd create --file tasks.md --dry-run`
- **THEN** the Beads CLI MUST successfully parse the hierarchical checkbox format and preview the issue graph.

### Requirement: Meta-Label Inheritance
The sync automation SHALL ensure that all generated Beads inherit the `domain` and `scope` labels defined in the `bd mol pour` command.

#### Scenario: Hydrating with specific labels
- **WHEN** `bd mol pour openspec-sync --var domain=gridfinity --var scope=engine` is executed
- **THEN** all issues created from the resulting `tasks.md` MUST include the `domain:gridfinity` and `scope:engine` labels.
