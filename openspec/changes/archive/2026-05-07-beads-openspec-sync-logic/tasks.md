## 1. Formula Implementation

- [x] 1.1 Implement the `openspec-sync` formula in `.beads/formulas/openspec-sync.formula.json`.
  - **Validation**: `bd formula list` shows the new formula.
- [x] 1.2 Implement the `feature-probe` formula in `.beads/formulas/feature-probe.formula.json`.
  - **Validation**: `bd mol pour feature-probe --var system_name=test --dry-run` succeeds.

## 2. Agent Operational Loop

- [x] 2.1 Update `AGENTS.md` with the specific "Sync Handshake" protocol defined in the design.
  - **Validation**: Agent can recite the 4-step hydration protocol (Locate, Dry Run, Hydrate, Close).
- [x] 2.2 Define the `tasks.md` markdown template in the OpenSpec root to ensure compatibility with `bd create --file`.
  - **Validation**: `bd create --file tasks.md --dry-run` successfully parses a sample task file.

## 3. Verification

- [ ] 3.1 Perform an end-to-end "Sync" of a dummy OpenSpec change.
  - **Validation**: All tasks from the dummy `tasks.md` appear as Beads with correct parent/child relationships, labels, and `--design`/`--spec-id` links pointing to the OpenSpec files.
