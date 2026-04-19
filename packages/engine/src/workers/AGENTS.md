# workers/

## Responsibility

This package acts as the Web Worker boundary. It loads and executes GLPK.js WASM, receives payloads, and communicates asynchronously via `postMessage`.

## Type Ownership

Does not own primary domain types. Uses types defined in `solver/`.

## Import Rules

- **May import from**: `solver/`.
- **Must not import from**: `ui/`, `store/`.
- **Other rules**: Communication is typed using `solver/` schemas. The GLPK.js WASM import lives here.
