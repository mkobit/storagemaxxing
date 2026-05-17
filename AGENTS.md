# Storagemaxxing | Agentic Prime & Operational Rails

This file serves as the "Prime Directive" for all AI agents (Gemini, Claude, Jules, Opencode) operating in the Storagemaxxing monorepo.

## 🏗 Engineering Rails (The Laws of Physics)

- **Functional Purity:** All logic in `packages/geometry`, `packages/catalog`, and `packages/packer` MUST be pure functional. No side effects.
- **Immutability:** Use `const` and `readonly`. No `let`, no object mutation. Enforced by ESLint `functional/*` rules.
- **Strict Typing:** `strict: true` in all packages. No `any`. Use `unknown` + narrowing/validation.
- **Monorepo Topology:** Directed acyclic graph: Geometry → Catalog → Packer/Solver → Web UI.
- **Two-Layer Engine:** 
  - **Layer 1:** Synchronous 2D Geometric Fitting (Pure functions).
  - **Layer 2:** Asynchronous Constraint Validation (Layered on top, often in Workers).

## 🟢 Operational Loop (Spec-Driven & Bidirectional)

All agents MUST coordinate using **OpenSpec** (Design/Contract) and **Beads** (Execution/Tasking). OpenSpec is the source of truth; Beads is the engine.

1. **SYNC & DISCOVER:** 
   - Run `bd prime` to load the latest operational context.
   - Run `bunx openspec list --json` to identify active changes.
   - Use `bunx openspec status --change <name>` to locate the relevant `design.md` and `tasks.md`.
2. **PLAN:** Before coding, ensure an OpenSpec `design.md` and `tasks.md` exist and are synced to Beads via `bd mol pour openspec-sync`.
   - **Checkpoint:** All designs MUST be reviewed and approved by a human (using `status:needs-review`) before an agent starts the implementation phase.
3. **CLAIM:** Always claim a Bead with `bd update <id> --claim` before starting execution.
4. **EXECUTE & FLOWBACK:** Implement changes. If the design needs to change, update OpenSpec **BEFORE** proceeding with implementation or closing Beads.
5. **VALIDATE & CLOSE:** 
   - Run `bunx openspec validate` to ensure spec integrity.
   - Mark `tasks.md` checkboxes and run `bd close <id>`.
   - Run `bunx openspec archive` only after all linked Beads are closed.

Refer to **[.beads/PRIME.md](.beads/PRIME.md)** for detailed CLI instructions and **[openspec/config.yaml](openspec/config.yaml)** for schema-specific rules.

## 🧠 Shared Memory & Audit
- **Coordination:** Use `bd remember "<insight>"` to store operational knowledge (e.g., "The solver is currently hitting memory limits") that isn't a design spec but is critical for other agents.
- **Recall:** Use `bd recall` or `bd memories` to retrieve shared context at the start of a session.
- **Audit:** All interactions are recorded locally; use `bd audit record` if you need to explicitly log an architectural justification.

## 📐 Breadth of Rectangles (Product Strategy)

We prioritize **Horizontal Breadth** (many storage systems) over **Vertical Depth** (complex 3D/WASM solvers). 
- Default to **Modular 2D Fitters** first.
- CAD, 3D visualization, and complex global optimization are **Layered Features**, not core requirements.

## 🛠 Multi-Agent Sandbox & Sync

- **Identity:** Always attribute your actions to your agent name (e.g., `actor:gemini`).
- **Jules:** Jules is an autonomous agent optimized for high-integrity, focused execution. **Limit Jules to 1-2 tasks per execution cycle** to maintain quality.
- **Sync:** Always refresh state (`git pull` or `bd sync`) at the start of a session.
- **Jail (Execution Sandbox):** Agents MUST be invoked via project-local wrappers in `bin/` (e.g., `bin/gemini`, `bin/claude`). These wrappers enforce hard, OS-level isolation (Docker or Bubblewrap) and secure credential forwarding. Direct execution of global agent binaries is prohibited. Any session started outside the `bin/` sandbox will be terminated by `SessionStart` enforcement hooks.
- **MCP:** Use only the approved MCP servers defined in `mcp-config.json`. All local MCP servers MUST bind to `localhost` and be scoped to the project root.
