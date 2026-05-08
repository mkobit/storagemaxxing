## Why

Moving from an OpenSpec design to a Beads execution graph is currently a manual process. We need a "Bridge" that automates the creation of implementation tasks while preserving metadata (labels, domains, and dependencies) to maintain the "Breadth of Rectangles" philosophy.

## What Changes

- Create a Beads formula `openspec-sync` to bootstrap the implementation phase.
- Define a convention for how OpenSpec `tasks.md` are formatted to be `bd create --file` compatible.
- Establish the `meta:openspec` label for tracking tasks back to their design source.

## Capabilities

### New Capabilities
- `beads-openspec-sync`: The protocol for "pouring" a design into the task graph.
- `sync-automation`: Beads formulas that automate the creation of implementation epics.

## Impact

- **Beads**: New formulas in `.beads/formulas/`.
- **OpenSpec**: Updated `tasks.md` templates to ensure compatibility with `bd create`.
- **Workflow**: A new command `bd mol pour openspec-sync --var name=<change>` becomes the standard way to start implementation.

## Success Criteria

- Running `bd mol pour openspec-sync` creates a parent "Sync" bead.
- An agent (Gemini/Claude) can autonomously expand that sync bead into a full task graph using `bd create --file`.
- All generated beads are correctly labeled with the domain and scope defined in the design.
