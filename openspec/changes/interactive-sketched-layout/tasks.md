# Tasks: Interactive Sketched Layout

- [x] `sm-1oge` Zustand store actions for constraint management
  - **Acceptance**: `removeConstraintForSpace` deletes a constraint from the space instance in the state and all unit tests pass.
- [x] `sm-k6ky` Constraint Editor UI list rendering
  - **Acceptance**: The sidebar panel component renders active drawer constraints with names, quantities, and selectors.
- [x] `sm-kz97` Catalog bin picker UI
  - **Acceptance**: Clicking a compatible bin in the catalog list adds it as a constraint to the active space.
- [ ] `sm-wevy` Constraint mode editing and validation
  - **Acceptance**: Modifying a constraint's mode updates state and triggers layout validity recalculation.
- [ ] `sm-1x02` LocalStorage sketch persistence
  - **Acceptance**: Zustand sketch state is automatically saved to and hydrated from `localStorage` on page reload.
- [ ] `sm-o3vo` JSON sketch import and export UI
  - **Acceptance**: Toolbar buttons export state to a downloaded JSON file and import a JSON file.
