# Jules Agent Instructions

You are working in the Storagemaxxing Jules environment.

## Task & Issue Tracking

This project uses **[Beads (bd)](https://github.com/gastownhall/beads)** for all task and issue tracking.
At the start of every session, you MUST run `bd prime` to load the full operational workflow and command reference into your context.

## Project Rails

The following canonical documentation defines our technical and product constraints. You must strictly adhere to these while implementing tasks:

- [Architecture & Standards](../AGENTS.md)
- [Technical Stack](../docs/jules/tech.md)
- [Product Philosophy](../docs/jules/product.md)
- [Packing & Grid Constraints](../docs/jules/constraints.md)
- [System & Bin Definitions](../docs/jules/catalog.md)
- [Supplemental Workflows](../docs/jules/workflows.md)

## Session Protocol (Spec-Driven)

1. Run `bd prime` to load latest operational context.
2. Follow the **Operational Loop** defined in [AGENTS.md](../AGENTS.md):
   - **Discover**: Identify active OpenSpec designs.
   - **Hydrate**: Use `bd mol pour openspec-sync` if tasks aren't in Beads.
   - **Claim**: `bd update <id> --claim`.
   - **Execute & Flowback**: Update specs if design shifts.
   - **Close**: Check off `tasks.md` and run `bd close <id>`.
3. **MANDATORY**: Run `git add .` and `git push` to synchronize all task and code changes. We use **Git-backed JSONL** for issues, so `bd dolt push` is NOT required.
