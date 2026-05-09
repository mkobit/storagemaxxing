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

1. **TRIAGE:** Scan `bd ready` for unclaimed tasks.
2. **SYNC:** Check `openspec/changes/` for active designs and architectural contracts.
3. **CLAIM:** Run `bd update <id> --claim` to signal you are working on a task.
4. **DESIGN:** For `scope:engine` or `meta:breaking` changes, an OpenSpec `design.md` MUST exist before implementation.
5. **HYDRATE (The Bridge):** When picking up a `type:sync` task:
   - Locate `openspec/changes/{{change_name}}/`.
   - Dry run: `bd create --file tasks.md --dry-run`.
   - Hydrate with links: `bd create --file tasks.md --parent <sync_id> --labels <domain>,<scope>,meta:openspec --design openspec/changes/<change>/design.md --spec-id openspec/changes/<change>/proposal.md`.
   - Close the sync bead: `bd close <sync_id> --reason "Hydrated <change>."`.
6. **EXECUTE:** Implement focused, surgical changes. Update `tasks.md` as you go.
7. **VALIDATE:** Run `bun run lint && bun run typecheck && bun test`.
8. **FLOWBACK:** If implementation reveals necessary design changes, you MUST update the OpenSpec `design.md` or `proposal.md` BEFORE closing the bead.
9. **CLOSE:** Run `bd close <id> --reason "..."` and push changes.

## 📐 Breadth of Rectangles (Product Strategy)

We prioritize **Horizontal Breadth** (many storage systems) over **Vertical Depth** (complex 3D/WASM solvers). 
- Default to **Modular 2D Fitters** first.
- CAD, 3D visualization, and complex global optimization are **Layered Features**, not core requirements.

## 🛠 Multi-Agent Sandbox & Sync

- **Identity:** Always attribute your actions to your agent name (e.g., `actor:gemini`).
- **Jules:** Jules is an autonomous agent optimized for high-integrity, focused execution. **Limit Jules to 1-2 tasks per execution cycle** to maintain quality.
- **Sync:** Always refresh state (`git pull` or `bd sync`) at the start of a session.
- **Jail:** Respect the workspace root. Do NOT access files or execute commands outside `/home/mkobit/workspace/mkobit/storagemaxxing`.
- **MCP:** Use only the approved MCP servers defined in the project configuration.
