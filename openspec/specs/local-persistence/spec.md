# local-persistence Specification

## Purpose
TBD - created by archiving change interactive-sketched-layout. Update Purpose after archive.
## Requirements
### Requirement: Automatic Serialization

The application SHALL automatically serialize the active space, templates, and constraints on change.
The serialized sketch SHALL be written to IndexedDB.
On startup, the application SHALL check for saved state and hydrate the store.

#### Scenario: User reloads page

- **WHEN** the browser page is reloaded with a previously saved layout in IndexedDB
- **THEN** the application restores the spaces, templates, and activeSpaceId state from the database.

