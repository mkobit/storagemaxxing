## Purpose

Automate the process of hydrating Beads implementation tasks from OpenSpec design documents to maintain synchronization between design and execution.

## Requirements

### Requirement: Swarm-Based Task Hydration

The system SHALL use a Beads "Swarm" formula to initiate the hydration of the task graph from an OpenSpec design.

#### Scenario: Puring the sync formula

- **WHEN** the `openspec-sync` formula is poured for a specific OpenSpec change
- **THEN** a single Beads issue of type `task` SHALL be created with the labels `type:sync` and `meta:openspec`.

### Requirement: OpenSpec Task Source Linkage

All implementation tasks created via the sync logic SHALL be linked back to their originating OpenSpec change.

#### Scenario: Verifying metadata on hydrated tasks

- **WHEN** a batch of tasks is created from `tasks.md`
- **THEN** each task MUST have a label or metadata field identifying the OpenSpec change name (e.g., `meta:openspec`).
