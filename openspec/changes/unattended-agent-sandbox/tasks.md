<!--
  Checkbox state is synced from bd, not hand-edited -- update bead status via `bd close <id>`,
  then run `bun run fix:tasks` to regenerate the checkboxes in this file.
-->

## 1. Sandbox container: workspace isolation & toolchain bootstrap (independent of the hook-classifier work in §5-7)

- [ ] 1.1 [sm-exmy](../../../.beads) Author `.devcontainer/devcontainer.json` + Dockerfile bind-mounting the `storagemaxxing` workspace root only (base image and devcontainer feature set are an implementation choice, deliberately left open by design.md's Open Questions)
  - Validation: `docker run --rm <sandbox-image> sh -c 'test ! -e ~/.ssh && test ! -e ~/.gnupg && test ! -e ~/.aws && test ! -e ~/.config/gcloud'` exits `0`
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Workspace-Root Isolation (Scenario: Session attempts to read outside the workspace; Scenario: Session attempts to reach a host credential)
- [ ] 1.2 [sm-q02y](../../../.beads) Bootstrap the container's toolchain via `mise install` against the committed `mise.toml` (same bun `1.3.14` / beads `1.1.0` pins as CI and Jules), before `bun`/`bd` are invoked
  - Validation: `docker run --rm <sandbox-image> sh -c 'bun --version && bd --version'` prints `1.3.14` and `1.1.0`
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Scoped Toolchain Bootstrap (Scenario: Container starts a session)

## 2. Sandbox container: network egress enforcement

- [ ] 2.1 [sm-hnnb](../../../.beads) Implement the network egress allowlist (GitHub git/API endpoints + the bun package registry) enforced from outside the sandboxed process's own network namespace (host-level Docker network policy vs. proxy sidecar is an implementation choice, deliberately left open by design.md's Open Questions); the same allowlist applies during `mise install` bootstrap and during the live session, with no separate wider bootstrap-time carve-out
  - Validation: inside the running container, `curl -sf --max-time 5 https://example.com; echo $?` prints non-zero while `curl -sf --max-time 5 https://api.github.com; echo $?` prints `0`, and `docker inspect <container> --format '{{.HostConfig.CapAdd}}'` does not list `NET_ADMIN`
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Network Egress Allowlist (Scenario: Session attempts an unlisted network call; Scenario: Egress is enforced from outside the sandboxed process's own network namespace)
- [ ] 2.2 [sm-8bx5](../../../.beads) Disable (or route through the same allowlist check) the `WebFetch`/`WebSearch` tools for unattended sandbox sessions, via a sandbox-scoped Claude Code settings override distinct from the interactive session's `.claude/settings.local.json` (which currently allows `WebSearch`)
  - Validation: `rg -n '"WebFetch"|"WebSearch"' <sandbox-scoped-settings-file>` shows both tools denied or absent from the allow set
  - Scope: scope:tooling
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Network Egress Allowlist

## 3. Sandbox container: bd sandbox sync

- [ ] 3.1 [sm-5wdt](../../../.beads) Run `bd` in `--sandbox` mode for the session, and run `bd dolt pull` immediately before every `bd update --claim` (not only once at container start)
  - Validation: `rg -B1 'bd update .*--claim' <session-bootstrap-script>` shows `bd dolt pull` on the line immediately preceding every claim call site
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Session-Scoped bd Sync (Scenario: Session claims a bead)
- [ ] 3.2 [sm-n4b6](../../../.beads) Run exactly one `bd dolt push` as the session's final `bd`-related action before it ends
  - Validation: `rg -c 'bd dolt push' <session-end-script>` reports `1`, and it is the last `bd`-prefixed command in the script
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Session-Scoped bd Sync (Scenario: Session completes normally)

## 4. Credential scoping

Note: none of the three spec deltas contain a requirement written specifically against the GitHub token injected by Decision 1/3 (they only cover the host-credential _directories_ deliberately **not** mounted). Tasks below cite the closest existing requirement (`Workspace-Root Isolation`) as the nearest anchor — see the summary flag on this in the handoff notes; the human reviewer may want to add a dedicated requirement before these become beads.

- [ ] 4.1 [sm-pfa7](../../../.beads) Provision a fine-grained, repo-scoped GitHub token (`contents:write`, `pull-requests:write`, no `admin:*`, no other-repo access, session-length TTL) as the sandbox's sole injected credential
  - Validation: `gh api -H "Authorization: token $SANDBOX_TOKEN" repos/mkobit/storagemaxxing` returns `200`, and the same call against any other repo returns `404`/`403`
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Workspace-Root Isolation
- [ ] 4.2 [sm-vp21](../../../.beads) Decide and implement the session-scoped bot commit identity (resolves the open design question: dedicated machine GitHub user vs. GitHub App bot identity), distinct from the interactive `actor:claude`; commits from the sandbox use it instead of the human operator's signing key
  - Validation: `git log -1 --format='%an <%ae>'` on a commit made by a sandboxed session shows the resolved bot identity, and `bd show <bead>` records `actor:claude-sandbox`
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Workspace-Root Isolation
- [ ] 4.3 [sm-b4u5](../../../.beads) Explicitly revoke the injected GitHub token at session end (not reliance on TTL expiry alone)
  - Validation: after the session-end script runs, `gh api -H "Authorization: token $SANDBOX_TOKEN" /rate_limit` returns `401`
  - Scope: scope:infra
  - Spec: specs/agent-sandbox-runtime/spec.md#Requirement: Workspace-Root Isolation

## 5. Hook-based action gating: safe-action set (requires the safe/gated action taxonomy from design.md Decision 2, already finalized post-hole-poking)

- [ ] 5.1 [sm-3otd](../../../.beads) Generalize `.agents/hooks/git-commit-main-guard.ts`'s `PreToolUse`/`Bash` pattern (via the shared `readHookInput` helper in `claude-hook.ts`) into a safe-action-set classifier: `bun test`/`bun run lint`/`bun run typecheck`/`bunx openspec *`; `bd` claim/comment/create/close; `git commit` to a non-`main` branch; `git push` to a non-`main`, non-force branch of `mkobit/storagemaxxing` with the destination resolved via `git remote get-url` (not string-matched); `gh pr create`/`gh pr edit` against `mkobit/storagemaxxing`
  - Validation: `bun test .agents/hooks/safe-action-classifier.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Autonomous Safe-Action Set (Scenario: Session runs a safe action)
- [ ] 5.2 [sm-oh9n](../../../.beads) Route file edits/writes outside the path(s) implied by the claimed bead's `scope:` label to the gated set as a `scope-drift` event, instead of executing unconditionally
  - Validation: `bun test .agents/hooks/scope-drift-guard.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Autonomous Safe-Action Set (Scenario: Session writes outside its claimed bead's scope)

## 6. Hook-based action gating: gated/destructive-action set

- [ ] 6.1 [sm-amn3](../../../.beads) Gated-action-set classifier for: `git push --force`/`-f`/`--force-with-lease` on any branch; any git remote operation targeting a repo other than `mkobit/storagemaxxing`; reads matching the credential-pattern denylist (`.env`, `**/*credentials*`, `~/.ssh/**`, `~/.gnupg/**`); network calls outside the egress allowlist; `bd rename-prefix`/`bd migrate`/`bd flatten`/`bd compact`/`bd gc`/`bd delete`; writes to `.github/workflows/*`, ruleset config, `.claude/settings*.json`, or `.agents/hooks/**` itself
  - Validation: `bun test .agents/hooks/gated-action-classifier.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Gated Destructive-Action Set (Scenario: Session attempts a force-push; Scenario: Session attempts to widen its own gate)
- [ ] 6.2 [sm-64st](../../../.beads) Gate `gh pr merge`/`gh pr merge --auto` against any pull request, regardless of CI status or the session's own `mode:auto-ok`/`mode:hotl` labeling (closes the critical self-merge finding from the independent hole-poking pass, sm-mol-s7rt)
  - Validation: `bun test .agents/hooks/pr-merge-guard.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Gated Destructive-Action Set (Scenario: Session attempts to merge its own pull request)
- [ ] 6.3 [sm-6g56](../../../.beads) Fail-closed default: a tool call matching neither the safe set nor an enumerated gated pattern is blocked and queued (`unmatched-fail-closed`), not executed
  - Validation: `bun test .agents/hooks/fail-closed-default.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Gated Destructive-Action Set (Scenario: Tool call matches neither the safe nor the gated set)
- [ ] 6.4 [sm-91pq](../../../.beads) Implement the `GatedActionEvent` structured record (`sessionId`, `timestamp`, `toolName`, `reason` enum, `rawCommandOrPath`, `beadId`) and an append-only, one-file-per-`sessionId` queue writer — no shared file across concurrent sessions, per the concurrency finding in design.md's Domain Objects section
  - Validation: `bun test .agents/hooks/gated-action-event-queue.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Gated Destructive-Action Set (Scenario: Session attempts a force-push)

## 7. Hook-based action gating: session outcome labeling & wiring

- [ ] 7.1 [sm-7c17](../../../.beads) Derive `mode:auto-ok`/`mode:hotl` from `gatedActionCount === 0` (not self-reported by the session) and apply the label to the session's claimed bead(s) before it ends
  - Validation: `bun test .agents/hooks/session-outcome-labeling.test.ts`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Session Outcome Labeling Reuses `mode:auto-ok`/`mode:hotl` (Scenario: Session completes with a queued action)
- [ ] 7.2 [sm-668e](../../../.beads) Wire the generalized safe/gated hook set into `.claude/settings.json`'s `PreToolUse`/`PostToolUse` matchers, extending (not replacing) the existing `git-commit-main-guard.ts` wiring and the four `PostToolUse` edit hooks
  - Validation: `bun run typecheck && bun test .agents/hooks`
  - Scope: scope:tooling
  - Spec: specs/agent-action-gating/spec.md#Requirement: Gate Implemented as an Extension of the Existing Hook Mechanism (Scenario: New gating rule is added)

## 8. PR merge gate: ruleset & convention changes (GitHub API/settings changes, no code; independent of §1-7)

- [ ] 8.1 [sm-b9ek](../../../.beads) Add a `required_status_checks` rule to ruleset `14954375` naming the five job names in `.github/workflows/ci.yml`: `lint`, `typecheck`, `test`, `build-storybook`, `e2e`
  - Validation: `gh api repos/mkobit/storagemaxxing/rulesets/14954375 --jq '.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context'` lists all five names
  - Scope: scope:infra
  - Spec: specs/pr-merge-gate/spec.md#Requirement: Required Status Checks on the Default Ruleset (Scenario: PR opened by a sandboxed session has a failing check)
- [ ] 8.2 [sm-iign](../../../.beads) Enable GitHub's native merge queue on ruleset `14954375` so concurrent `mode:auto-ok` merges serialize instead of racing directly against `main`
  - Validation: `gh api repos/mkobit/storagemaxxing/rulesets/14954375 --jq '.rules[] | select(.type=="merge_queue")'` returns a non-empty rule
  - Scope: scope:infra
  - Spec: specs/pr-merge-gate/spec.md#Requirement: Merge Queue Serializes Concurrent Auto-Merges (Scenario: Two `mode:auto-ok` PRs are eligible to merge at the same time)
- [ ] 8.3 [sm-dgh6](../../../.beads) Document the procedural (deliberately not yet ruleset-enforced — see design.md's resolved Open Question, sm-mol-bhbn) `mode:hotl`-requires-human-approval-before-merge convention in the PR template and/or `AGENTS.md`
  - Validation: `rg -n 'mode:hotl' .github/pull_request_template.md AGENTS.md` matches in at least one file
  - Scope: scope:docs
  - Spec: specs/pr-merge-gate/spec.md#Requirement: Human Review Required for `mode:hotl` Sessions (Scenario: `mode:hotl` PR passes CI but has no human approval; Scenario: `mode:auto-ok` PR passes CI)

## 9. Explicitly out of scope (accepted residual risk or deferred elsewhere — no implementation task)

- **Sandbox escape via a compromised container image/supply chain**: accepted residual risk (design.md Risks); the hole-poking pass found no concrete escape beyond this general class, so no task attempts to fully solve it.
- **Hook bypass via command obfuscation** (write-then-execute through the `Write` tool, shell variable/command-substitution indirection defeating flag-matching regexes): confirmed live by the independent hole-poking pass and structurally not closable by adding more patterns. Decision 2 reframes the hook as defense-in-depth against accidental actions, not a primary boundary — no task attempts to close this category.
- **Credential exposure via environment variable and GitHub-API-as-exfiltration-sink**: accepted residual risk (design.md Decision 3). Detection-based mitigation (denylist, egress allowlist) structurally cannot see either path; mitigated only by the token scope/TTL/revocation work in §4, not by detection.
- **Full `bd`/Dolt claim conflict resolution** (compare-and-swap or locking beyond "pull before every claim," §3.1): whether `bd` has any CAS/conflict-detection semantics is an unresolved open question in design.md, not something this change's task set can close; a follow-up bead against `bd` itself (or a lock/serialization mechanism) is needed if the residual race proves unacceptable in practice.
- **Promoting `mode:hotl` from a procedural convention to a ruleset-enforced required-reviewer rule**: explicitly deferred by the resolved Open Question (sm-mol-bhbn) — ship procedural first (§8.3), promote only if procedural compliance fails in practice.
- **A human-review consumer tool/UI for the `GatedActionEvent` queue**: not scoped by this design (proposal.md's Success Criteria only requires actions to be queued, not that a dedicated reader tool exist). A human reads the per-session queue files directly (e.g. `cat`/`jq`) until a future change adds one.
- **Re-verifying the `agent-sandbox-security` (sm-lez1) `bin/` history conclusion**: design.md's Context section states this is the best available evidence, not a certainty, and explicitly does not attempt to recover or resurrect that unverified prior work; this change does not re-investigate it further.
