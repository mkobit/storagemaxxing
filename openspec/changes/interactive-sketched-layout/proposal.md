# Proposal: Interactive Sketched Layout

## Why

Currently, layouts and constraints can only be loaded via hardcoded golden-path setup presets.
Users cannot dynamically configure or build layouts in the browser.
To make Storagemaxxing an interactive tool, we must enable users to configure constraints directly.
We also need persistence so that configurations are saved across browser reloads.

## What Changes

- Add a constraint editor sidebar panel to the web application.
- Extend the Zustand store to support adding, removing, and updating constraints.
- Leverage the existing IndexedDB storage for state persistence.
- Add JSON export and import capabilities with schema validation to the main toolbar.

## Capabilities

### New Capabilities

- `interactive-constraint-editing`: Add, modify, and delete space constraints dynamically.
- `local-persistence`: Verify and leverage the existing IndexedDB-backed persistence.
- `state-serialization`: Download and upload layout state as JSON with validation.

## Success Criteria

- Users can build and view layouts in the web application from scratch.
- Layout validation and BOM panels update reactively to user input.
- User data is preserved on reload via the IndexedDB store persistence.
