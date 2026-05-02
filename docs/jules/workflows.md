# Project Workflows & Rails

This document supplements the core [Beads workflow](https://github.com/gastownhall/beads) with project-specific conventions.

## Project Rails
- [Architecture & Standards](../../AGENTS.md)
- [Canonical Documentation](../jules/) (Constraints, Tech, Product, Catalog)

## Issue Tagging & Categorization
Use labels to categorize work beyond the base types:
- `ui`: Changes affecting the frontend or user interface.
- `engine`: Changes to packing logic or solver integration.
- `testing`: New tests or testing infrastructure.
- `docs`: Documentation-only updates.

## Supplemental Session Close Protocol
In addition to the standard beads protocol, ensure the following for this project:
1. **Linter Check:** Run `bun run lint` before committing.
2. **Type Safety:** Ensure `bun run typecheck` passes across all packages.
3. **Beads Sync:** Always run `bd dolt push` to ensure the task database is synchronized with the remote hidden refs.
