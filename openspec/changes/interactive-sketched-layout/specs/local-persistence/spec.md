# Capability: Local Persistence

## Purpose

This capability automatically saves the user's sketch layout so that it is preserved across browser refreshes.

## ADDED Requirements

### Requirement: Automatic Serialization

The application SHALL automatically serialize the active space, templates, and constraints on change.
The serialized sketch SHALL be written to `localStorage`.
On startup, the application SHALL check for saved state and hydrate the store.

#### Scenario: User reloads page

- **WHEN** the browser page is reloaded with a previously saved layout in `localStorage`
- **THEN** the application restores the spaces, templates, and activeSpaceId state from the saved storage data.
