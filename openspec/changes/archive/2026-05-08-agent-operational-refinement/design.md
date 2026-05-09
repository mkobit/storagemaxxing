## Context

This design refines the "Agentic Prime" by closing the loop between session start and session close. It ensures that "Thinking" always precedes "Doing" and that "Execution" always updates "Knowledge."

## Decisions

### 1. The 9-Step Handshake
The operational loop is expanded to include specific "Guard" steps for session continuity.

1. **TRIAGE**: Scan `bd ready`.
2. **SYNC**: Check `openspec/changes/` for active designs.
3. **CLAIM**: `bd update <id> --claim`.
4. **DESIGN**: Ensure `design.md` exists for complex tasks.
5. **HYDRATE**: "Pour" OpenSpec tasks into Beads.
6. **EXECUTE**: Implement changes following "Engineering Rails."
7. **VALIDATE**: Run build/lint/test.
8. **FLOWBACK**: Update OpenSpec with execution-phase insights.
9. **CLOSE**: Close bead and push.

### 2. Mandatory Session Start (RESUME)
Agents must not perform any `bd ready` triage without first running `bd prime` and verifying the state of `openspec/changes/`.

### 3. Mandatory Session Close (ALIGNMENT)
Agents must not run `bd close` without first verifying that the implemented logic is reflected in the canonical OpenSpec artifacts.

## Risks / Trade-offs

- **[Risk]**: Agents might find the loop too verbose.
- **[Mitigation]**: We keep the steps high-level and focus on the *intent* of alignment rather than micro-managing specific commands.
