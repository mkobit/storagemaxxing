# Design: Interactive Sketched Layout

## Store Layer Extensions

We will extend `AppActions` with clean state modifiers for editing constraints.
The store actions will delegate to a helper to avoid complex state mutation in selectors.
We will add `removeConstraintForSpace` to cleanly delete constraints from the space instance.
The store updates will preserve immutability and functional purity rules.

## LocalStorage Synchronization

We will implement a simple middleware or subscriber for Zustand state updates.
On every state change, the active space, templates, and constraints will be serialized to JSON.
We will write this JSON string to localStorage under the key `storagemaxxing-sketch`.
On application startup, the store initializer will check for this key and hydrate the initial state if present.
For JSON file import/export, we will implement standard browser file downloader and uploader APIs.

## UI Sidebar Layout

We will adjust the main layout in `App.tsx` to introduce a two-column workspace.
The left column will display the Sidebar Panel, and the right column will display the LayoutCanvas / BOM.
The Sidebar Panel will be styled using vanilla CSS.
It will render two sections: "Active Constraints" and "Add Bins from Catalog".
"Active Constraints" lists each added bin constraint with controls to increment/decrement count, toggle mode, or delete.
"Add Bins from Catalog" displays compatible bin definitions loaded from the selected catalog.
