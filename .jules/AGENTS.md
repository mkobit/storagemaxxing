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

## Session Protocol
1. Check `bd ready` for assigned or available work.
2. Claim an issue with `bd update <id> --claim` before starting.
3. Once complete, close the issue with `bd close <id>`.
4. **MANDATORY**: Run `bd dolt push` followed by `git push` to synchronize all task and code changes.
