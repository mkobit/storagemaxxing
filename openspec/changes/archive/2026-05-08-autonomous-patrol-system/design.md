## Context

This design formalizes the "Patrol" pattern for autonomous agents. A Patrol is a recurring task that has no fixed "Done" state; it is a duty that an agent performs periodically to maintain the integrity of the system.

## Decisions

### 1. Stored Prompt Architecture

Prompts are stored as Markdown files in `.jules/prompts/`. Each file defines a **Protocol** for a specific duty.

- **Example**: `.jules/prompts/backlog-hygiene.md`
- **Structure**:
  - **Goal**: What this duty achieves.
  - **Frequency**: How often it should be performed.
  - **Step-by-Step Protocol**: Precise CLI commands for the agent to run.
  - **Reporting**: How to log the results.

### 2. The `autonomous-patrol` Formula

A new Beads formula that instantiates a recurring duty.

```json
{
  "formula": "autonomous-patrol",
  "description": "Recurring duty for autonomous agents",
  "type": "workflow",
  "vars": {
    "duty_name": {
      "description": "Filename in .jules/prompts/",
      "required": true
    },
    "agent_id": {
      "description": "Target agent (e.g., jules, opencode)",
      "required": true
    }
  },
  "steps": [
    {
      "id": "execute-patrol",
      "title": "Patrol: {{duty_name}}",
      "type": "task",
      "labels": ["meta:patrol", "actor:{{agent_id}}"],
      "description": "Read the protocol at `.jules/prompts/{{duty_name}}.md` and execute it fully. Log your findings as a comment on this bead."
    }
  ]
}
```

### 3. Jules Integration

Since Jules is "fully autonomous with no hooks," we bootstrap Jules by ensuring the first instruction in its native environment is:

> "Read `.beads/PRIME.md` and check for any `meta:patrol` beads assigned to `actor:jules`."

## Initial Patrol Registry (Candidates)

1. **`backlog-alignment`**: Ensures every Beads issue matches an OpenSpec design.
2. **`tag-auditor`**: Corrects and updates labels per `.beads/TAGS.md`.
3. **`design-linker`**: Uses `bd update --design` to ensure all tasks have proper context.
4. **`feature-scout`**: Scans for `TODO` comments in code and converts them to Beads.

## Risks / Trade-offs

- **[Risk]**: Agents might enter an infinite loop if the patrol prompt is too vague.
- **[Mitigation]**: Every patrol prompt MUST have a "Termination Condition" (e.g., "Stop after checking 5 issues").
- **[Trade-off]**: Increased filesystem noise.
- **[Mitigation]**: We use the `.agents/` hidden directory to keep the root clean.
