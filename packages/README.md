# Packages (`packages`)

## Overview

Monorepo workspace packages implementing geometry primitives, storage catalogs, assembly domain models, bin packing/CP-SAT solving, and client state management.

## Subdirectories & boundaries

- `assembly`: [./assembly/README.md](./assembly/README.md) — Zod-validated space, constraint, packing result, and BOM domain models.
- `catalog`: [./catalog/README.md](./catalog/README.md) — Storage system schemas, built-in bin catalogs, and lookup helpers.
- `geometry`: [./geometry/README.md](./geometry/README.md) — 2D/3D primitives, branded inch/millimeter units, fractions, and oblique projection.
- `packer`: [./packer/README.md](./packer/README.md) — 2D bin packing (`maxrects-packer`) and OR-Tools CP-SAT Protobuf/WASM solver pipeline.
- `store`: [./store/README.md](./store/README.md) — IndexedDB-persisted Zustand store, layout selectors, solver reducers, and sketch serialization.
