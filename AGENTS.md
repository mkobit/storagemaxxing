# StorageMaxxing

This is the central repository for StorageMaxxing.
This application is a strictly client-side constraint solver and placement engine for organizational storage systems (like Gridfinity, OpenGrid, etc.).
It runs entirely in the browser using Bun, React 19, Zustand, and a GLPK.js Web Worker.

## Architecture & code philosophy

- **Functional and immutable**: No `let`, no mutation, no side effects outside designated boundaries.
  Use `const` and `readonly` types everywhere.
- **Small files**: Split by responsibility.
- **Single responsibility**: One primary concept per file.
  Name files after the export.
- **Types live with their domain**: No centralized types folder.
- **Strict types**: No `any`.
  Strict TS config.
  Unknown + narrowing preferred.
- **Exports**: Named exports only.
  No default exports.
- **Barrel files**: Prohibited in `src/` subdirectories to prevent circular dependencies. 
  **Exception**: Each package (e.g., `packages/packer/`) must have a root `index.ts` barrel file to export its public API.
- **No circular dependencies**: Strictly enforced via `import/no-cycle`.
- **Pure logic cores**: `geometry/`, `packer/`, and `catalog/` must be 100% pure functions.

## Package dependency tree

Dependencies must strictly flow downwards:
`ui` -> `store` -> (`assembly`, `packer`, `solver`)
`assembly` -> `catalog` -> `geometry`
`packer` -> `catalog`, `geometry`
`solver` -> `assembly`, `catalog`, `geometry`
`workers` -> `solver`

## Issue Tracking

This project uses **[Beads (bd)](https://github.com/gastownhall/beads)** for all task and issue tracking.
Operational context is auto-loaded via `bd prime`. 
Refer to [docs/jules/workflows.md](docs/jules/workflows.md) for supplemental conventions and session-close protocols.
