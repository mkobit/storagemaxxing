# Project Workflows & Rails

This document serves as the high-level map for project operations.
Detailed Beads conventions and automated agent loops are located in the task database configuration.

## 🟢 Spec-Driven Operational Loop
All development follows the **OpenSpec + Beads** bidirectional loop:
1. **Discover**: Run `bunx openspec list --json` to find active designs.
2. **Hydrate**: If tasks aren't in Beads, run `bd mol pour openspec-sync --var change_name=<name>`.
3. **Claim**: `bd update <id> --claim`.
4. **Execute & Flowback**: If implementation reveals design shifts, update OpenSpec `design.md` or `tasks.md` **FIRST**.
5. **Validate & Close**: Check off `tasks.md` and run `bd close <id>`.

Detailed command reference and pre-close checklists are in:
- [.beads/PRIME.md](../../.beads/PRIME.md) (Operational Loop)
- [.beads/TAGS.md](../../.beads/TAGS.md) (Label Taxonomy)

## 📖 Canonical Docs
- [Product Philosophy](product.md)
- [Technical Stack](tech.md)
- [Geometric Constraints](constraints.md)
