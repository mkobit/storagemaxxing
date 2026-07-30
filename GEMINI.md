@AGENTS.md

## 🏗 Technical Rails

These programmatic guardrails are enforced by the build system. For detailed specifications, refer to:

- [Engineering Standards Design](openspec/changes/engineering-standards/design.md)
- [Automated Verification Spec](openspec/changes/engineering-standards/specs/automated-verification/spec.md)

> **Note:** This file has no local Beads Integration block. The `@AGENTS.md` import above already pulls in AGENTS.md's full `profile:full` block, including the hand-patched branch+PR fix (see AGENTS.md's own warning banner, tracked in sm-sws7). If `bd setup gemini --check` reports the integration missing or stale, that's expected — do not run `bd setup gemini` to "fix" it; regenerating would add back a redundant, un-patched duplicate here.
