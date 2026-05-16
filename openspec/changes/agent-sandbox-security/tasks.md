<!--
  IMPORTANT: After creating this file, you MUST hydrate it into Beads:
  bd mol pour openspec-sync --var change_name=agent-sandbox-security
-->

## 1. Agent Guardrails (Local Jail)

- [x] 1.1 **Standardize Root Boundary**: Update `AGENTS.md` and `GEMINI.md` to explicitly define the project root as the absolute execution boundary for all agents. 
  - **Validation**: Check that both files contain the updated boundary text.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`
- [x] 1.2 **Local Execution Restrictions**: Research and document specific OS-level or environment-level restrictions for local agents (Ollama, Opencode) to prevent access outside the `storagemaxxing` folder.
  - **Validation**: Added as a new section in `openspec/changes/agent-sandbox-security/specs/local-boundary-enforcement/spec.md`.
  - **Labels**: `scope:infra`, `type:research`, `meta:agent-rails`
- [x] 1.3 **Local MCP Jail**: Update all local MCP server configurations to strictly bind to `localhost` and limit their scope to the current working directory.
  - **Validation**: Inspect `mcp-config.json` (or equivalent) for host/path restrictions.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`

## 2. Platform Policy Alignment (Cloud Sandbox)

- [x] 2.1 **Native Sandbox Documentation**: Audit and document the native sandboxing capabilities of Gemini and Claude platforms as they relate to our workspace.
  - **Validation**: New section in `openspec/changes/agent-sandbox-security/specs/hybrid-sandbox-policy/spec.md`.
  - **Labels**: `scope:infra`, `type:research`, `meta:agent-rails`
- [ ] 2.2 **Prime Nudge Calibration**: Refine the "Prime Directive" in `AGENTS.md` to use specific, platform-native keywords that improve sandbox compliance (e.g., using "jail" vs "boundary").
  - **Validation**: Verify that agents acknowledge the refined nudge in session start.
  - **Labels**: `scope:infra`, `type:feature`, `meta:agent-rails`

## 3. State Sync Protocol (The Handshake)

- [ ] 3.1 **Refresh-Before-Read Enforcement**: Update the `/opsx-apply` and `/opsx-propose` slash command definitions to include a mandatory `git pull` or `bd sync` step at the session start.
  - **Validation**: Verify command files in `.gemini/commands/opsx/` and `.claude/commands/opsx/`.
  - **Labels**: `scope:infra`, `type:feature`, `meta:beads-flow`
- [ ] 3.2 **Task Claiming (Locking) Enforcement**: Ensure the `/opsx-apply` workflow strictly requires a `bd update <id> --claim` before any file modifications.
  - **Validation**: (Already partially done, but verify full compliance in all command variants).
  - **Labels**: `scope:infra`, `type:feature`, `meta:beads-flow`
- [ ] 3.3 **Session Boundary Sync**: Implement a "Check-out" protocol at the end of agent sessions that ensures `git push` and `bd dolt push` are executed.
  - **Validation**: Verify session end hooks or command instructions.
  - **Labels**: `scope:infra`, `type:feature`, `meta:beads-flow`

## 4. Validation & Stress Testing (Adversarial Audit)

- [ ] 4.1 **Cross-Agent Conflict Simulation**: Manually simulate a conflict between two agents (e.g., Gemini and Opencode) attempting to claim the same Bead.
  - **Validation**: Confirm that Beads correctly prevents the second claim and provides a clear error.
  - **Labels**: `scope:infra`, `type:research`, `meta:beads-infra`
- [ ] 4.2 **Boundary Violation Spike**: Attempt to have a local agent read a file outside the repo (e.g., `~/.ssh/config`) to test the effectiveness of the new guardrails.
  - **Validation**: The request must be blocked or the agent must refuse based on its directive.
  - **Labels**: `scope:infra`, `type:research`, `status:needs-repro`
- [ ] 4.3 **Sync Latency Audit**: Measure the time overhead of frequent `bd sync` operations and adjust the "Session Boundary" rules if latency exceeds 5 seconds.
  - **Validation**: Documented latency results and updated sync rules if necessary.
  - **Labels**: `scope:infra`, `type:performance`, `meta:beads-flow`
