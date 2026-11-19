# Packer (`packages/packer`)

## Overview

Package `@storagemaxxing/packer` provides 2D bin-packing (`maxrects-packer`) and an OR-Tools CP-SAT Protobuf/WASM solver pipeline.

## Subdirectories & boundaries

- `proto`: [./proto/README.md](./proto/README.md) — Upstream OR-Tools CP-SAT protobuf schemas.
- `src`: [./src/README.md](./src/README.md) — Packing engine, CP-SAT model builder/decoder, WASM loader, and generated protobuf bindings.
- `test`: [./test/README.md](./test/README.md) — Golden-path packing integration tests and worker transferable `ArrayBuffer` messaging benchmarks.
