# storagemaxxing — agent context

## Project overview

A client-side web application built with React + Vite + Three.js, using IndexedDB (via `idb`) for local browser storage.
The goal is interactive WebGL-driven UX with persistent local state.

## Stack

- **Runtime:** Bun 1.3.11
- **Build:** Vite 6 + `@vitejs/plugin-react`
- **UI:** React 19 (strict mode)
- **3D/WebGL:** Three.js
- **Storage:** IndexedDB via `idb`
- **Types:** TypeScript 5 (strict)
- **Lint:** ESLint 9 with `@typescript-eslint`
- **Format:** Prettier

## Key constraints

- All TypeScript must pass `tsc --noEmit` with the settings in `tsconfig.app.json` (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes).
- DB access goes through `src/db.ts` only — no direct `indexedDB` calls elsewhere.
- Three.js resources (geometries, materials, renderers) must be disposed in `useEffect` cleanup.
- No SSR — this is a pure client-side SPA.

## Scripts

```
bun run dev        # local dev server
bun run build      # type-check + vite build
bun run typecheck  # tsc --noEmit only
bun run lint       # eslint
bun run format     # prettier --write
```

## File structure

```
src/
  main.tsx   — React root mount
  App.tsx    — top-level component with Three.js canvas
  db.ts      — all IndexedDB access via idb
```
