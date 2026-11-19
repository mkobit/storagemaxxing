# Project Workflows & Rails

This document serves as the high-level map for project operations.
Detailed Beads conventions and automated agent loops are located in the task database configuration.

## 🟢 Operational Loop

All development follows the **Beads** operational loop:

1. **Triage**: Run `bd ready` to find ready work.
2. **Claim**: `bd update <id> --claim`.
3. **Execute**: Implement focused changes following Engineering Rails.
4. **Validate & Close**: Run `mise run check` and `bd close <id>`.

Detailed command reference and pre-close checklists are in:

- [.beads/PRIME.md](../../.beads/PRIME.md) (Operational Loop)
- [.beads/TAGS.md](../../.beads/TAGS.md) (Label Taxonomy)

## 📖 Canonical Docs

- [Product Philosophy](product.md)
- [Technical Stack](tech.md)
- [Geometric Constraints](constraints.md)
