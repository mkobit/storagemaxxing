## Context

We need a deterministic way to move from "Thinking" (OpenSpec) to "Doing" (Beads). The `bd mol pour` command provides a mechanism for instantiating templates, but since OpenSpec tasks are dynamic, we use a **Swarm-based Sync** approach.

## Goals / Non-Goals

**Goals:**

- Automate the hydration of the Beads backlog from `tasks.md`.
- Inherit metadata (labels, parent IDs) from the design context.
- Maintain a link between every Bead and its originating OpenSpec change.

**Non-Goals:**

- Auto-syncing _backwards_ from Beads to OpenSpec (OpenSpec is the authority).

## Decisions

### 1. The `openspec-sync` Formula

The formula will be a "Swarm" type, which signals to agents that it requires active processing rather than just static expansion.

```json
{
  "formula": "openspec-sync",
  "description": "Hydrate Beads from OpenSpec {{change_name}}",
  "type": "workflow",
  "vars": {
    "change_name": {
      "description": "The OpenSpec change folder name",
      "required": true
    },
    "domain": { "description": "Target domain label", "required": false },
    "scope": { "description": "Target scope label", "required": false }
  },
  "steps": [
    {
      "id": "expand-tasks",
      "title": "Expand Tasks from {{change_name}}",
      "type": "task",
      "labels": ["type:sync", "meta:openspec"]
    }
  ]
}
```

### 2. The Agent Handshake (The "Bridge")

When an agent sees a task with `type:sync` and `meta:openspec`, it must follow this protocol:

1.  **Locate Context**: Find `openspec/changes/{{change_name}}/`.
2.  **Dry Run**: Run `bd create --file tasks.md --dry-run` to verify the task structure.
3.  **Hydrate with Linking**: Run `bd create --file tasks.md` with:
    - `--parent {{sync_bead_id}}`
    - `--labels {{domain}},{{scope}},meta:openspec`
    - `--design openspec/changes/{{change_name}}/design.md`
    - `--spec-id openspec/changes/{{change_name}}/proposal.md`
4.  **Close**: Run `bd close {{sync_bead_id}} --reason "Hydrated {{change_name}} into task graph with bidirectional links."`

### 3. Markdown Formatting Standards

To be `bd create --file` compatible, `tasks.md` MUST follow the hierarchical checkbox format:

```markdown
# Epic Title (Optional)

## 1. Group Name

- [ ] 1.1 Task Description
- [ ] 1.2 Task Description
```

## Risks / Trade-offs

- **[Risk]**: Duplicate tasks if `bd mol pour` is run twice.
- **[Mitigation]**: Agents should check for existing beads with the `meta:openspec` label and `{{change_name}}` reference before hydrating.
- **[Trade-off]**: Requires an agent turn to "Expand."
- **[Mitigation]**: This provides a natural human-in-the-loop checkpoint before the backlog is flooded.
