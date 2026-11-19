# Jules Agent Instructions

You are working in the Storagemaxxing Jules environment.

## Task & Issue Tracking

This project uses **[Beads (bd)](https://github.com/gastownhall/beads)** for all task and issue tracking.
At the start of every session, you MUST run `bd prime` to load the full operational workflow and command reference into your context.

## Project Rails

The following canonical documentation in `agent_docs/` defines our technical and product constraints. You must strictly adhere to these while implementing tasks:

- [Engineering Rails](../agent_docs/engineering-rails.md)
- [Operational Loop & Bead Contract](../agent_docs/operational-loop.md)
- [Issue Tracking & Session Completion](../agent_docs/beads-workflow.md)
- [Shared Memory & Multi-Agent Sandbox](../agent_docs/multi-agent-sandbox.md)
- [Product Strategy](../agent_docs/product-strategy.md)
- [Tooling Patterns](../agent_docs/tooling-patterns.md)
- [Technical Stack](../docs/jules/tech.md)
- [Product Philosophy](../docs/jules/product.md)
- [Packing & Grid Constraints](../docs/jules/constraints.md)
- [System & Bin Definitions](../docs/jules/catalog.md)
- [Supplemental Workflows](../docs/jules/workflows.md)

## Session Protocol

1. Run `bd prime` to load latest operational context.
2. Follow the **Operational Loop** defined in [Operational Loop](../agent_docs/operational-loop.md):
   - **Triage**: Run `bd ready` to find your next task.
   - **Claim**: `bd update <id> --claim`.
   - **Execute**: Implement focused changes following "Engineering Rails".
   - **Close**: Run `bd close <id>`.
3. **MANDATORY**: Follow the Session Completion workflow in [Issue Tracking & Session Completion](../agent_docs/beads-workflow.md).
