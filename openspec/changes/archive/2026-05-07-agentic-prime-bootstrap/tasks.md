## 1. Agent Priming

- [x] 1.1 Update `AGENTS.md` at the root to include the "Agentic Prime" operational loop and "Breadth of Rectangles" philosophy.
- [x] 1.2 Update `.claude/commands/opsx/` and `.gemini/commands/opsx/` to be monorepo-aware and link to the new standards.
- [x] 1.3 Ensure `PRIME.md` in `.beads/` correctly references the OpenSpec design authority workflow.

## 2. Beads Automation (The Bridge)

- [x] 2.1 Create a Beads formula `bd mol pour feature-probe` that:
  - Creates an OpenSpec change for a new storage system.
  - Spawns a Beads issue for the Design phase.
- [x] 2.2 Create a Beads formula `bd mol pour implementation-sync` that:
  - Reads OpenSpec `tasks.md` and creates corresponding Beads.
  - Links the Beads to the OpenSpec change name.

## 3. Validation

- [x] 3.1 Verify that a mock agent session (e.g., Gemini) correctly identifies the new `AGENTS.md` and refuses to implement a 3D feature without a spec.
- [x] 3.2 Verify that `bd mol pour feature-probe --var name=test-system` correctly initializes the OpenSpec/Beads bridge.
