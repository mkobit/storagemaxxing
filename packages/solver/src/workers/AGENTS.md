# workers/

## Responsibility

This directory contains Web Worker entry points. It exists to offload heavy solver logic from the main thread.

## Type Ownership

Owns: Worker message interfaces (e.g., `WorkerRequest`, `WorkerResponse`).

## Import Rules

- **May import from**: `solver/` ONLY.
- **Must not import from**: `ui/`, `store/`.
- **Other rules**: Do not leak Worker-specific types outside this folder.
