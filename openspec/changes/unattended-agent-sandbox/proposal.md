## Why

Every Claude Code session in this repo today runs with live per-tool-call approval: a human watches and clicks approve/deny on each Bash call, edit, and git operation.
This caps session length and throughput to how long a human can babysit a terminal.
It does not scale to overnight runs, multi-hour refactors, or delegating a full bead to an agent the way `.jules/` already delegates to Jules.

Jules already proved the alternative shape works in this repo: `.jules/prompts/delegation-contract.md` dispatches Jules **autonomously by default** (`--auto-approve --auto-pr`), constrains it with a path allowlist plus a pre-commit `git status --porcelain` check instead of live approval, and treats the resulting PR plus CI as the safety net.
Claude Code has no equivalent today — approval is per-tool-call and synchronous, and there is no container boundary between the agent process and the host (host credentials, other repos on disk, and the user's shell are all reachable).

`main` is already branch-protected (GH013: PR required, no direct push, no force-push, no deletion — verified via `gh api repos/mkobit/storagemaxxing/rulesets/14954375`).
That check confirmed something not previously documented: the ruleset requires a PR to exist but sets `required_approving_review_count: 0` and defines no required status checks, so a PR can currently merge with zero human approvals and without CI having run.
"PR-gated" is a structural checkpoint today (a PR must exist), not yet a quality gate (nothing forces it to be green or reviewed).
Moving to unattended sessions makes that gap load-bearing: today a human is present and typically merges only after watching CI, so the missing required-checks configuration is masked.
Take the human out of the loop and it stops being masked.

An earlier OpenSpec change (`agent-sandbox-security`, sm-lez1, archived 2026-07-08) covered a related but different problem: workspace-boundary enforcement and Beads/OpenSpec state-sync across five different agent runtimes (Claude, Gemini, Jules, Opencode, Ollama).
Its close note claims infrastructure "winnings" were preserved in `bin/`.
`git log --all -- bin` and `git log --all --diff-filter=D -- 'bin/*'` both return empty — no commit in this repository's history has ever touched a `bin/` path, deleted or otherwise.
The child beads under sm-lez1 (Universal Sandbox Wrapper, Docker Provider, SSH/GPG Agent Bridge, Sandbox Detection Hook, Credential Leak Spike, Bypass Simulation) have no comments, no linked commits, and identical boilerplate acceptance text closed via "bulk lint resolution."
The close note's claim about `bin/` does not check out against the git history; see `design.md` Context section for the full account.
This change does not attempt to recover or resurrect that unverifiable prior work — it designs the sandbox mechanism fresh, reusing only what is independently verifiable in the current repo (the `.jules/` delegation model, the existing `.agents/hooks/` PreToolUse/PostToolUse hook mechanism, and bd's own `--sandbox`/`--readonly` flags).

## What Changes

- Define a devcontainer-based sandbox that scopes an unattended Claude Code session to the `storagemaxxing` workspace root only: no host credentials, no sibling repos, no host SSH/GPG agent by default.
- Define an approval model that reuses and extends the existing `.claude/settings.json` hook mechanism (already gating `git commit` on `main` via `.agents/hooks/git-commit-main-guard.ts`) into a broader auto-approve/gate proxy, reusing the `mode:auto-ok` / `mode:hotl` label taxonomy already established for Jules dispatch in `.jules/prompts/delegation-contract.md` rather than inventing a new one.
- Define credential scoping inside the sandbox: a fine-grained GitHub token limited to this repo with no admin/other-repo scope, git push restricted to non-`main` branches (defense-in-depth on top of the GH013 ruleset, which already blocks direct-to-main and force-push at the platform level), and no host credential mounts.
- Define what "PR as checkpoint" must mean once no human watches the session live: tightening the `default` ruleset to add required status checks (the existing `lint`, `typecheck`, `test`, `build-storybook`, `e2e` jobs in `.github/workflows/ci.yml`) so a PR cannot merge on a red or unrun CI run, independent of whether merge itself is human- or automation-triggered.
- File child task beads for each concrete change once the design has passed its mandatory independent hole-poking pass (see `design.md` Risks section) — this proposal and its design are scoped only through the design-architecture step; task beads are deliberately not filed yet.

## Capabilities

### New Capabilities

- `agent-sandbox-runtime`: The devcontainer/Docker isolation layer that bounds an unattended Claude Code session to the workspace root, its process/network surface, and the credentials explicitly injected into it.
- `agent-action-gating`: The proxy/hook-based approval model that auto-approves safe, reversible tool calls and queues destructive ones (force-push, secret access, external network calls outside an allowlist) for async human review instead of a live y/n prompt.
- `pr-merge-gate`: The tightened branch-protection configuration (required status checks on the `default` ruleset) that makes the PR a real quality gate now that no human necessarily watches CI before merge.

### Modified Capabilities

(none — no existing `openspec/specs/*` capability changes requirements; this is new infrastructure, not a change to packing/geometry/catalog behavior)

## Impact

- **Packages (DAG)**: None of `geometry`, `catalog`, `assembly`, `packer`, `store`, `web` are touched by this change — it is agent-orchestration and repo-tooling infrastructure, not product code, and sits entirely outside the lint-enforced package DAG.
- **Configuration**: New devcontainer/Docker definition (location TBD in design), an extended `.claude/settings.json` hook set alongside the existing `.agents/hooks/*.ts` hooks, and a GitHub ruleset change (`repos/mkobit/storagemaxxing/rulesets/14954375`) adding required status checks.
- **Workflow**: `AGENTS.md` Session Completion / branch-protection guidance is unaffected in substance (main was already protected) but gains a documented required-checks gate; `.jules/prompts/delegation-contract.md`'s `mode:auto-ok`/`mode:hotl` taxonomy gets a second consumer (Claude sandbox sessions) instead of being Jules-only.
- **Audit**: Sandbox sessions must produce the same `bd`-tracked claim/close/comment trail as any other agent session; credential scope and gated/queued actions must be logged for post-hoc human review since no one watched live.

## Success Criteria

- An unattended Claude Code session can run inside the sandbox against this repo with zero host credential or sibling-repo access, verified by attempting (and failing) a read of a path outside the workspace root and a git remote outside `mkobit/storagemaxxing`.
- Safe/reversible actions (file edits inside the workspace, `bun test`/`bun run lint`/`bun run typecheck`, `git commit` to a non-`main` branch, `gh pr create`) proceed with no human interaction during the session.
- Destructive actions (force-push, push to `main`, reading files matching a credential-pattern denylist, network calls to non-allowlisted hosts) are blocked or queued for async review rather than silently allowed or silently denied.
- The `default` ruleset on `mkobit/storagemaxxing` requires the CI jobs in `.github/workflows/ci.yml` to pass before a PR opened by a sandboxed session can merge.
- A follow-up independent adversarial review (fresh-context subagent, per the feature-probe formula's hole-poking step) has run against `design.md` and its findings are folded back before any implementation bead is filed.
