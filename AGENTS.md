# StorageMaxxing

This is the central repository for StorageMaxxing.
This application is a strictly client-side constraint solver and placement engine for organizational storage systems (like Gridfinity, OpenGrid, etc.).
It runs entirely in the browser using Bun, React 18, Zustand, and a GLPK.js Web Worker.
State is persisted solely to localStorage.

## Architecture & code philosophy

- **Functional and immutable**: No `let`, no mutation, no side effects outside designated boundaries.
  Use `const` and `readonly` types everywhere.
- **Small files**: Strict 150 lines per source file limit.
  Split by responsibility.
- **Single responsibility**: One primary concept per file.
  Name files after the export.
- **Types live with their domain**: No centralized types folder.
- **Strict types**: No `any`.
  Strict TS config.
  Unknown + narrowing preferred.
- **Exports**: Named exports only.
  No default exports.
  No index.ts barrel files.
- **No circular dependencies**: Strictly enforced via `import/no-cycle`.
- **Pure logic cores**: `geometry/`, `engine/`, and `catalog/` must be 100% pure functions (no expression statements, throws, or try/catch blocks).

## Package dependency tree

Dependencies must strictly flow downwards:
`ui` -> `store` -> (`assembly`, `engine`, `solver`)
`assembly` -> `catalog` -> `geometry`
`engine` -> `catalog`, `geometry`
`solver` -> `assembly`, `catalog`, `geometry`
`workers` -> `solver`

Before editing any package, read the corresponding `AGENTS.md` in its directory.
