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

## 🟢 Operational Loop (Multi-Agent Handshake)

All agents MUST coordinate through the filesystem using **Beads** and **OpenSpec**. **OpenSpec is the Canonical Source of Truth** for all architectural and design decisions; Beads is the execution derivative.

### The Pipeline (`openspec/workflow.yaml`):
1. **DRAFT & PROPOSE:** Changes begin as proposals in `openspec/changes/`.
2. **DESIGN:** AI or human establishes the technical design, data flow, and schemas.
3. **DECOMPOSE:** Once the design is approved, AI agents break the design down into `<30m` tasks using `tasks.md` (via `bd mol pour openspec-decompose`).
4. **HYDRATE:** Tasks are synced into the Beads database (via `bd mol pour openspec-sync`).
5. **IMPLEMENT:** Agents claim and execute hydrated tasks.

### Agent Execution Workflow:
1. **TRIAGE:** Scan `bd ready` for unclaimed tasks. **DO NOT execute code implementation tasks unless they are explicitly in the `Implemented` stage of the OpenSpec pipeline.**
2. **SYNC:** Check `openspec/changes/` for active designs and architectural contracts.
3. **CLAIM:** Run `bd update <id> --claim` to signal you are working on a task.
4. **PIPELINE AWARENESS:** If a task requires human review (e.g., proposing a design), draft the change and set the issue to `status:blocked-by-human`. **Halt execution until review is complete.**
5. **EXECUTE:** Implement focused, surgical changes. Update `tasks.md` as you go.
6. **VALIDATE:** Run `bun run lint && bun run typecheck && bun test`.
7. **FLOWBACK:** If implementation reveals necessary design changes, you MUST update the OpenSpec `design.md` or `proposal.md` BEFORE closing the bead.
8. **CLOSE:** Run `bd close <id> --reason "..."` and push changes.

## 📐 Breadth of Rectangles (Product Strategy)

We prioritize **Horizontal Breadth** (many storage systems) over **Vertical Depth** (complex 3D/WASM solvers). 
- Default to **Modular 2D Fitters** first.
- CAD, 3D visualization, and complex global optimization are **Layered Features**, not core requirements.

## 🛠 Multi-Agent Sandbox & Sync

- **Identity:** Always attribute your actions to your agent name (e.g., `actor:gemini` or `actor:jules`).
- **Jules:** Jules is an autonomous agent optimized for high-integrity, focused execution. **Limit Jules to 1-2 tasks per execution cycle** to maintain quality.
- **Sync:** Always refresh state (`git pull` or `bd sync`) at the start of a session.
- **Jail:** Respect the workspace root. Do NOT access files or execute commands outside `/home/mkobit/workspace/mkobit/storagemaxxing`.
- **MCP:** Use only the approved MCP servers defined in the project configuration.
