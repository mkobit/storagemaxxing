# Capability: Interactive Constraint Editing

## Purpose

This capability allows users to dynamically edit, update, and delete constraints in the active space.

## ADDED Requirements

### Requirement: Interactive Editing

The user SHALL be able to select compatible bins from the active catalog and add them as constraints.
The user SHALL be able to modify the target quantity of any constraint.
The user SHALL be able to delete a constraint from the active space.

#### Scenario: User edits constraints in sidebar

- **WHEN** the user selects a bin, increments the quantity, or removes it in the editor sidebar panel
- **THEN** the active space's constraints list in state is updated accordingly.
