# Capability: State Serialization

## Purpose

This capability allows importing and exporting layout state as JSON files.

## ADDED Requirements

### Requirement: JSON Export

The user SHALL be able to download the active sketch state as a JSON file.

#### Scenario: User exports sketch

- **WHEN** the user exports the sketch state to a file
- **THEN** a valid JSON file of the sketch is downloaded.

### Requirement: JSON Import

The user SHALL be able to upload a previously exported JSON file to restore the sketch layout.

#### Scenario: User imports sketch

- **WHEN** the user imports a valid sketch JSON file
- **THEN** the state is loaded into the Zustand store.
