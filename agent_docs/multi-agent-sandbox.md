# Shared Memory & Multi-Agent Sandbox

## Shared Memory & Audit

- **Coordination:** Use `bd remember "<insight>"` to store operational knowledge (e.g., "The solver is currently hitting memory limits") that isn't a design spec but is critical for other agents. (`.beads/PRIME.md`'s RESUME step already covers recall at session start.)
- **Audit:** All interactions are recorded locally; use `bd audit record` if you need to explicitly log an architectural justification.

## Multi-Agent Sandbox & Sync

- **Identity:** Always attribute your actions to your agent name (e.g., `actor:gemini`).
- **Jules:** Jules is a remote agent with a large execution quota but limited reasoning. Delegate many small, narrowly scoped tasks to it — **1-2 Beads per execution cycle**, each satisfying the Bead task contract. Never hand Jules open-ended design work or multi-package changes.
- **Patrols:** Recurring duties live in `.jules/prompts/` with a Goal, Frequency, and Protocol. Jules MUST check for assigned `meta:patrol` beads before picking up other tasks.
- **Sync:** Always refresh state (`git pull` or `bd sync`) at the start of a session.
- **Jail:** Respect the workspace root. Do NOT access files or execute commands outside `/home/mkobit/workspace/mkobit/storagemaxxing`.
- **MCP:** Use only the approved MCP servers defined in the project configuration.
