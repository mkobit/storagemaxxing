# Storagemaxxing | Agentic Prime & Operational Rails

This file serves as the "Prime Directive" for all AI agents (Gemini, Claude, Jules, Opencode) operating in the Storagemaxxing monorepo.

## 🏗 Engineering Rails (The Laws of Physics)

- **Functional Purity:** All logic in `packages/geometry`, `packages/catalog`, and `packages/packer` MUST be pure functional. No side effects.
- **Immutability:** Use `const` and `readonly`. No `let`, no object mutation. Enforced by ESLint `functional/*` rules.
- **Strict Typing:** `strict: true` in all packages. No `any`. Use `unknown` + narrowing/validation.
- **tsconfig Scope:** When adding TypeScript files outside a package's `src/` directory (e.g., `scripts/`, `e2e/`), verify the directory is listed in that package's `tsconfig.json` `include` array or ESLint will fail to parse it.
- **Monorepo Topology:** Lint-enforced directed acyclic graph: `geometry → catalog → assembly → packer → store → web`. Upward or lateral imports fail `bun run lint`.
- **Engine:** Layer 1 only — synchronous 2D geometric fitting (pure functions) in `packages/packer`. Layer 2 (asynchronous constraint validation) is deferred and has no package.

## 🟢 Operational Loop (Spec-Driven & Bidirectional)

All agents MUST coordinate using **OpenSpec** (Design/Contract) and **Beads** (Execution/Tasking). OpenSpec is the source of truth; Beads is the engine.

1. **SYNC & DISCOVER:**
   - Run `bd bootstrap --yes` to ensure the local database is initialized.
   - Run `bd dolt pull` to fetch the latest operational context.
   - Run `bd prime` to load the context into your session.
   - Run `bunx openspec list --json` to identify active changes.
   - Use `bunx openspec status --change <name>` to locate the relevant `design.md` and `tasks.md`.
   - If working on `apps/web`, run `bun run dev` then `bun run screenshot` to capture the baseline UI before touching anything.
2. **PLAN:** Before coding, ensure an OpenSpec `design.md` and `tasks.md` exist and are synced to Beads via `bd mol pour openspec-sync`.
   - **Checkpoint:** All designs MUST be reviewed and approved by a human (using `status:needs-review`) before an agent starts the implementation phase.
3. **CLAIM:** Always claim a Bead with `bd update <id> --claim` before starting execution.
   Never modify a file unless you own the claim on the corresponding Bead.
4. **EXECUTE & FLOWBACK:** Implement changes. If the design needs to change, update OpenSpec **BEFORE** proceeding with implementation or closing Beads.
5. **VALIDATE & CLOSE:**
   - Run `bunx openspec validate` to ensure spec integrity.
   - Mark `tasks.md` checkboxes and run `bd close <id>`.
   - **Commit immediately after every closed Bead:** `git add <changed files> && git commit -m "task(<id>): <description>"`. Never accumulate multiple tasks in one commit.
   - Run `bunx openspec archive` only after all linked Beads are closed.

6. **META-PROCESS REFLECTION (MANDATORY):**
   - Before ending a session, you MUST reflect on the workflow itself.
   - Did you hit a tool limitation? Was a spec ambiguous? Was there manual friction?
   - **Action:** Record these as "Meta" beads: `bd create "Meta: <insight>" -t task -p 3 -l meta:beads-flow`.
   - **Action:** Use `bd remember "<insight>"` for transient operational tips.

Refer to **[.beads/PRIME.md](.beads/PRIME.md)** for detailed CLI instructions and **[openspec/config.yaml](openspec/config.yaml)** for schema-specific rules.

## Bead task contract

Every implementation Bead MUST satisfy this contract before an agent claims it:

- Names exactly one package (or `apps/web`) in a `scope:` label.
- References the OpenSpec spec requirement it implements.
- Carries an acceptance criterion runnable as a command (test, lint, or typecheck invocation).

If a Bead cannot meet the contract, re-scope it or flag it with `bd human <id>` instead of claiming it.
If you cannot finish a claimed Bead, leave it `open` with a comment linking the relevant OpenSpec change so another agent can resume.

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
- **Jules:** Jules is a remote agent with a large execution quota but limited reasoning. Delegate many small, narrowly scoped tasks to it — **1-2 Beads per execution cycle**, each satisfying the Bead task contract. Never hand Jules open-ended design work or multi-package changes.
- **Patrols:** Recurring duties live in `.jules/prompts/` with a Goal, Frequency, and Protocol. Jules MUST check for assigned `meta:patrol` beads before picking up other tasks.
- **Sync:** Always refresh state (`git pull` or `bd sync`) at the start of a session.
- **Jail:** Respect the workspace root. Do NOT access files or execute commands outside `/home/mkobit/workspace/mkobit/storagemaxxing`.
- **MCP:** Use only the approved MCP servers defined in the project configuration.

## ⚡️ High-Velocity Bun Patterns

- **Runtime Enforcement:** We use `[run] bun = true` in `bunfig.toml` to ensure all scripts (Vite, ESLint, etc.) run with the Bun runtime for maximum speed.
- **Root-Level Execution:** To run a script in a subproject from the root, use the `--cwd` flag:
  ```bash
  bun --cwd apps/web dev
  bun --cwd packages/geometry test
  ```
- **Filter-based:** Alternatively, use `--filter` for workspace-aware execution:
  ```bash
  bun run --filter @storagemaxxing/web dev
  ```

<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:f65d5d33 -->

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

Always include `--validate` and `--acceptance` for task/feature/bug types:

```bash
bd create "Issue title" --description="Detailed context" -t task -p 2 --validate --acceptance "Given ..., when ..., then ..." --json
bd create "Issue title" --description="What this issue is about" -t bug -p 1 --validate --acceptance "Bug no longer reproduces" --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Quality

- Use `--acceptance` and `--design` fields when creating issues
- Use `--validate` to check description completeness

### Lifecycle

- `bd defer <id>` / `bd supersede <id>` for issue management
- `bd stale` / `bd orphans` / `bd lint` for hygiene
- `bd human <id>` to flag for human decisions
- `bd formula list` / `bd mol pour <name>` for structured workflows

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd lint       # MUST pass before pushing — fix any missing Acceptance Criteria
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
