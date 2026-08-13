# Storagemaxxing | Agentic Prime & Operational Rails

This file serves as the "Prime Directive" for all AI agents (Gemini, Claude, Jules, Opencode) operating in the Storagemaxxing monorepo.

> ⚠️ **Do not blindly run `bd setup codex`/`claude`/`gemini` to clear a "stale" warning.** The Session Completion block in `agent_docs/beads-workflow.md` was hand-patched (sm-94br) to require a feature branch + PR instead of a direct `git push`, because `main` is branch-protected (GH013). Regenerating reverts that patch. If `bd setup <recipe> --check` reports stale, diff the output first and re-apply the branch+PR requirement to `CRITICAL RULES` if the regen wipes it. Tracked in sm-sws7.

## 📚 Agent Guidance Modules (`agent_docs/`)

- [Engineering Rails](agent_docs/engineering-rails.md) — Laws of physics, purity, immutability, topology.
- [Operational Loop & Bead Task Contract](agent_docs/operational-loop.md) — OpenSpec vs Bead-only decision rule, sync, commit discipline.
- [Issue Tracking & Session Completion](agent_docs/beads-workflow.md) — Beads lifecycle, quality gates, Dolt sync, session completion & branch+PR workflow.
- [Shared Memory & Multi-Agent Sandbox](agent_docs/multi-agent-sandbox.md) — Identity, Jules delegation, audit logs, memory.
- [Product Strategy](agent_docs/product-strategy.md) — Horizontal breadth over vertical depth.
- [Tooling & High-Velocity Bun Patterns](agent_docs/tooling-patterns.md) — Pinned tooling devDependencies, Bun execution patterns.

---

@agent_docs/engineering-rails.md

@agent_docs/operational-loop.md

@agent_docs/beads-workflow.md

@agent_docs/multi-agent-sandbox.md

@agent_docs/product-strategy.md

@agent_docs/tooling-patterns.md
