# Design: Interactive Sketched Layout

## Store Layer Extensions

We will extend `AppActions` with clean state modifiers for editing constraints.
The store actions will delegate to a helper to avoid complex state mutation in selectors.
We will add `removeConstraintForSpace` to cleanly delete constraints from the space instance.
The store updates will preserve immutability and functional purity rules.

## IndexedDB Persistence

We will leverage the existing IndexedDB storage configured in `useStore.ts`.
Since Zustand's `persist` middleware is already set up with `idbStorage`, no manual localStorage sync is needed.
We will verify that dynamically modified constraints and spaces are successfully serialized to IndexedDB.
On store hydration, the application will automatically restore the workspace state.

## JSON Import/Export & Schema Validation

For exporting, we will serialize the store state to JSON and download it.
For importing, we will define a Zod schema to strictly validate the uploaded JSON payload.
The schema will verify the structure of spaces, templates, and constraints before loading them into the store.
Invalid JSON formats, missing fields, or prototype pollution attempts will be rejected with an error toast.
All input numbers will be clamped to safe ranges (e.g. quantities between 0 and 100) to prevent engine freezes.
All custom names and descriptions will be sanitized before rendering to prevent XSS.

## UI Sidebar Layout

We will adjust the main layout in `App.tsx` to introduce a two-column workspace.
The left column will display the Sidebar Panel, and the right column will display the LayoutCanvas / BOM.
The Sidebar Panel will be styled using vanilla CSS.
It will render two sections: "Active Constraints" and "Add Bins from Catalog".
"Active Constraints" lists each added bin constraint with controls to increment/decrement count, toggle mode, or delete.
"Add Bins from Catalog" displays compatible bin definitions loaded from the selected catalog.
