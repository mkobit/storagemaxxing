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

## Docker Sandbox Configuration

You can run sandbox validations using:
```sh
sbx env exec .sbx/sbxenv.yaml -- mise run validate-sbx
```

Or with an optional personal overlay that shouldn't be checked into git:
```sh
sbx env exec .sbx/sbxenv.yaml ~/.local/share/sbx/personal/personal.sbxenv.yaml -- mise run validate-sbx
```

You can run sandboxes using:
```sh
sbx env run .sbx/sbxenv.yaml
```

Or with an optional personal overlay:
```sh
sbx env run .sbx/sbxenv.yaml ~/.local/share/sbx/personal/personal.sbxenv.yaml
```

To execute a command directly inside the sandbox:
```sh
sbx env exec .sbx/sbxenv.yaml ~/.local/share/sbx/personal/personal.sbxenv.yaml -- <project-check-command>
```

For AGY environments, use `.sbx/sbxenv.agy.yaml` instead, which preserves its extra pinned agent-kit reference. The overlay is optional and must not be referenced by tracked environment files, and does not alter the valid global `~/.sbxenv.yaml` default. Pass the same ordered environment files for plan/create/run/exec/rm, with `-- COMMAND` after both paths for exec. Explicit paths skip the automatic home `~/.sbxenv.yaml`; lists concatenate, and existing sandboxes need recreation to receive changed kits.
