## Context

### Current state

Claude Code sessions in this repo run with live, per-tool-call approval.
`.claude/settings.local.json` pre-approves a flat allowlist of specific commands (`bd create *`, `bun run *`, `git commit *`, etc.); anything not on that list prompts a human.
`.claude/settings.json` additionally wires four `PostToolUse` hooks on `Edit|Write` (lint-on-edit, typecheck-on-edit, openspec-validate-on-edit, openspec-canonical-guard-on-edit — the last of which produced the validation error this design had to satisfy while being written) and one `PreToolUse` hook on `Bash`: `.agents/hooks/git-commit-main-guard.ts`, which greps the command string for `git commit`, checks the current branch via `git rev-parse --abbrev-ref HEAD`, and exits `2` (blocking) if the branch is `main` and no branch-creation command precedes the commit in the same script.
This hook is real, already merged, and is the closest existing thing to the "tool-call proxy" the epic asks for — it just covers one destructive action today.

There is no container or VM boundary between the agent process and the host: an interactive session today can read `$HOME`, other repos under `/home/mkobit/workspace/mkobit/`, and any host credential the user's shell can reach — it doesn't in practice because a human is watching every tool call, but nothing in the tooling itself enforces that boundary.

`main` is branch-protected via a GitHub ruleset (confirmed via `gh api repos/mkobit/storagemaxxing/rulesets/14954375`, `enforcement: active`, `current_user_can_bypass: never`), with three rules: `deletion`, `non_fast_forward`, and `pull_request` (`required_approving_review_count: 0`, no required reviewers, `allowed_merge_methods: ["squash"]`).
No `required_status_checks` rule is present.
This means: direct push, force-push, and branch deletion are blocked at the platform level (this part of AGENTS.md's GH013 guidance is accurate and does not need to change), but **a PR can currently merge with zero approvals and without any CI job having run or passed** — `.github/workflows/ci.yml` runs `lint`, `typecheck`, `test`, `build-storybook`, and `e2e` on every `pull_request` to `main`, but none of them are wired into the ruleset as required checks. Today this gap is masked because a human is present and, by convention, merges only after seeing CI go green. An unattended session removes that human backstop from the merge decision, so the gap becomes load-bearing rather than theoretical.

### Prior art: `agent-sandbox-security` (sm-lez1, archived 2026-07-08)

This is a different problem, already solved and archived: workspace-boundary enforcement and Beads/OpenSpec state-sync across five agent runtimes (Claude, Gemini, Jules, Opencode, Ollama).
Its `design.md` (read in full) makes the explicit call that cloud-hosted agents (Claude, Gemini) should "rely on native `sandbox` tools" and use `AGENTS.md` to nudge them toward correct pathing — i.e. it deliberately did not design a container-based isolation layer or a tool-call gating proxy for Claude specifically; that's a **non-goal** it stated outright ("Redundant sandboxing of already-sandboxed cloud tools"), which is exactly the gap this change fills.

Its close reason states: *"OpenSpec change archived. Infrastructure 'winnings' preserved in bin/; further work deferred."*
This claim does not hold up:

- `git log --all -- bin` and `git log --all --diff-filter=D -- 'bin/*'` both return **empty** — no commit in this repository's history, on any branch, has ever touched a `bin/` path.
- The ten child beads (sm-lez1.1 through sm-lez1.10 — "Universal Sandbox Wrapper," "Docker Provider," "SSH Agent Bridge," "GPG Agent Bridge," "User Config Mapping," "Agent-Specific Wrappers," "Sandbox Detection Hook," "Gemini/Claude Integration," "Credential Leak Spike," "Bypass Simulation") all carry identical boilerplate acceptance text (`Requirements defined in design or parent task are met.` / `(Fixed via bulk lint resolution)`), have zero comments, and `bd history sm-lez1` errors out (a NULL-description scan error) rather than showing a real audit trail.
- The actual `design.md`/`tasks.md` content for sm-lez1 (three checkbox items: update `AGENTS.md`, configure `.opencode/settings.json`, ensure Beads auto-commit) is far shallower than what the child bead titles imply was built.
- The one repo commit that mentions "sandbox" near this timeframe (`b95db3e`, "autonomous Jules dispatch + sandbox fix") is about a different concept — Jules's snapshot-sandbox drift defense (git checkout/clean before scoping a diff) — not a Docker provider or credential bridge.

**Conclusion**: there is no verifiable evidence a Docker provider, universal sandbox wrapper, or SSH/GPG agent bridge was ever built in this repo. The close note's `bin/` claim is either aspirational, describes work done in a different (uncommitted, or since-deleted-without-trace) location, or is simply inaccurate. This design does not attempt to recover or assume the existence of that unverified work. It designs the container mechanism from scratch, and it explicitly does **not** reuse the SSH/GPG agent bridge concept (see Decisions, Credential Scoping) — bridging a human's host signing keys into a container built for *unattended* execution runs directly counter to this change's own goal.

### Prior art: Jules delegation (`.jules/prompts/delegation-contract.md`)

This is live, current, and directly reusable. Read in full. Key mechanisms already in production for a different (remote, not-live-in-terminal) unattended runner:

- A label taxonomy applied to delegate-ready beads, including `mode: hotl | auto-ok` — `hotl` requires human PR review before merge, `auto-ok` is mergeable on CI-green. Verified in use: `bd list --all -l mode:auto-ok` returns 5 closed beads (the per-package "enumerate exported types" research probes), `bd list --all -l mode:hotl` returns 2.
- Standard dispatch is **autonomous by default** (`jules session create ... --auto-approve --auto-pr`), with a path-allowlist + pre-commit `git status --porcelain` diff check as the safety net instead of live plan approval.
- `bd dolt push` as the mandatory last step before a session reports done, because all `bd` writes during a session only land in the sandbox-local Dolt DB otherwise.
- `.jules/env_setup.sh` installs `mise`, runs `mise install` against the committed `mise.toml`, then `bd bootstrap --yes` + `bd dolt pull` — the exact toolchain-bootstrap pattern this design reuses for the Claude sandbox container.

This design's approval model is best understood as: **the same trust model as `.jules/`'s autonomous dispatch, applied to a locally-run Claude Code session instead of a remotely-dispatched one** — and because Claude Code sessions are live tool-call loops (not a single git-diff artifact reviewed after the fact like a Jules run), the enforcement mechanism is a **live hook-based proxy** (extending `git-commit-main-guard.ts`'s pattern) rather than Jules's after-the-fact `git status --porcelain` check.

### `bd`'s own sandbox flags

`bd --help` / `bd label --help` expose two relevant global flags: `--sandbox` ("Sandbox mode: disables Dolt auto-push") and `--readonly` ("Read-only mode: block write operations (for worker sandboxes)").
`--readonly` is not the right default for this design — the sandboxed Claude session needs to claim, comment, and close beads during the session, which are writes.
`--sandbox` (defer push, one explicit `bd dolt push` at the end) matches the Jules pattern above and is adopted directly.

## Goals / Non-Goals

**Goals:**

- Define a container-based isolation mechanism scoped to the `storagemaxxing` workspace root, with no host credential or sibling-repo access.
- Define which actions run fully autonomously vs. which are gated for async human review, as an extension of the existing hook mechanism — not a new approval system.
- Define credential scoping inside the sandbox (GitHub token, git push restrictions, no host SSH/GPG bridge).
- Define what "PR as checkpoint" requires now that no human necessarily watches the session live, including closing the required-status-checks gap found in the current ruleset.
- Reuse verified, currently-in-production prior art (`.jules/` delegation model, `.agents/hooks/*`, `mode:auto-ok`/`mode:hotl` labels, `bd --sandbox`) wherever it overlaps, instead of inventing parallel mechanisms.

**Non-Goals:**

- Building a general "Agent OS" or unifying sandbox policy across Gemini/Opencode/Ollama — that scope belongs to (and was explicitly declined by) the archived `agent-sandbox-security` change.
- Recovering, resurrecting, or assuming the existence of the unverified sm-lez1 "Docker Provider"/"Universal Sandbox Wrapper" work.
- Bridging the human operator's host SSH or GPG keys into the container. Unattended sessions do not sign as the human.
- Designing the container image build/CI pipeline for the devcontainer itself in full detail, or picking the exact base image — that is implementation-bead-level work, deferred until after the hole-poking pass (see Risks).
- Filing the concrete implementation task beads. Per the feature-probe formula, task beads are filed only after an independent, fresh-context adversarial (hole-poking) pass and remediation — this design has not yet had that pass. Filing implementation beads against an un-adversarially-reviewed design for a security-sensitive change (sandbox escape, credential leakage, unattended git push are exactly its failure modes) would mean re-scoping them immediately after remediation anyway.

## Decisions

### 1. Sandbox mechanism: devcontainer, workspace-root bind mount only

A `.devcontainer/devcontainer.json` (+ Dockerfile) defines the sandbox. The container:

- Bind-mounts `storagemaxxing` only — no `$HOME`, no sibling repo directories under `/home/mkobit/workspace/mkobit/`.
- Bootstraps its toolchain via `mise install` against the committed `mise.toml` (same tool versions bun `1.3.14` / beads `1.1.0` as CI and Jules — not a separately maintained pin).
- Mounts no host credential directories (`~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.config/gcloud`).
- Injects exactly one credential: a fine-grained, repo-scoped GitHub token (contents:write, pull-requests:write; no admin; no other-repo access), session-length TTL, not the human operator's host `gh auth` token.
- Restricts outbound network to an explicit allowlist: GitHub (git + REST/GraphQL API) and the bun package registry. `WebFetch`/`WebSearch` tools are disabled (or routed through the same allowlist check) for unattended sessions — an unattended agent has no human present to notice a prompt-injection payload from an arbitrary fetched page.
- Runs `bd` in `--sandbox` mode for the session; the session's last `bd`-related action is exactly one `bd dolt push` (mirrors the Jules "push once, at the end" rule, verified as already load-bearing in `delegation-contract.md` — omitting it there is called out as fatal for research-only output).

### 2. Approval model: extend the existing hook proxy, classify actions into two sets

No new approval system. `.agents/hooks/git-commit-main-guard.ts`'s pattern (a `PreToolUse` hook on the `Bash` matcher, reading `tool_input.command`, exiting `2` to block) is generalized into a broader rule set covering the action classes below, reusing the same `readHookInput` helper (`.agents/hooks/claude-hook.ts`) already shared across the four `PostToolUse` hooks.

**Autonomous / safe set** (proceeds immediately, no prompt):
file edits/writes inside the workspace root; `bun test` / `bun run lint` / `bun run typecheck` / `bunx openspec *`; `bd` claim/comment/create/close; `git commit` to a non-`main` branch; `git push` to a non-`main`, non-force-pushed branch of `mkobit/storagemaxxing`; `gh pr create` / `gh pr edit` against `mkobit/storagemaxxing`.
This is close to today's `.claude/settings.local.json` allowlist already, generalized from a flat command-string allowlist into a hook so new safe commands don't require hand-editing a settings file every time.

**Gated / destructive set** (hook blocks the tool call, exit `2`, appends a structured event — see Zod schema below — to an async review queue instead of executing):
`git push --force`/`-f`/`--force-with-lease` on any branch; any git remote operation targeting a repository other than `mkobit/storagemaxxing`; reads matching a credential-pattern denylist (`.env`, `**/*credentials*`, `~/.ssh/**`, `~/.gnupg/**` — belt-and-suspenders, since these paths should not even be mounted per Decision 1); network calls outside the egress allowlist; `bd rename-prefix` / `bd migrate` / `bd flatten` / `bd compact` / `bd gc`; any write to `.github/workflows/*`, ruleset config, or `.claude/settings.json` itself (a sandboxed session must not be able to loosen its own gate — this rule protects the other rules).

A session that ends having queued zero gated actions labels its bead(s) `mode:auto-ok`; a session that queued at least one labels `mode:hotl` — reusing the exact taxonomy `.jules/prompts/delegation-contract.md` already defines, giving it a second consumer instead of a Claude-specific label scheme.

### 3. Credential scoping

- GitHub: fine-grained PAT or GitHub App installation token, `mkobit/storagemaxxing`-only, `contents:write` + `pull-requests:write`, no `admin:*`, no other-repo scope, short TTL.
- Git push: defense in depth at two layers — (a) the GH013 ruleset already blocks direct-push/force-push/deletion on `main` at the platform level regardless of token scope (`current_user_can_bypass: never`), (b) the hook additionally refuses to even attempt a `git push` matching `main` or a force flag, so the destructive attempt never reaches GitHub and gets queued for review instead of bouncing off a platform-level 403.
- No host SSH/GPG bridge (see Non-Goals). Commits from the sandbox are attributed to a session-scoped bot identity (`actor:claude-sandbox` in `bd`'s audit trail, distinct from the interactive `actor:claude`), not signed with the human operator's personal key.
- No other host credentials (cloud provider, npm token beyond what's needed for public registry reads, etc.) are injected.

### 4. PR as checkpoint: close the required-status-checks gap, keep review conditional

- Add a `required_status_checks` rule to ruleset `14954375` naming `lint`, `typecheck`, `test`, `build-storybook`, `e2e` (the job names already in `.github/workflows/ci.yml`) — this is the concrete fix for the gap found in Context: today's ruleset requires a PR to exist but not to be green.
- Merge eligibility is then conditional on the session's own `mode:auto-ok`/`mode:hotl` labeling: `mode:auto-ok` + required checks green is mergeable without a live human (matching the existing "autonomous merge on green CI" convention already in practice for other work); `mode:hotl` requires an explicit human approval first. This split is intentionally not yet a `required_approving_review_count` ruleset change — start procedural (PR template / convention), promote to a ruleset-enforced required-reviewer rule later if procedural compliance proves unreliable in practice. Flagged as an open question below.
- CI itself is unaffected by the sandbox: it already runs in GitHub Actions with its own `GITHUB_TOKEN`, outside the container this design defines.

## Data Flow

```
                         (async human review queue)
                                    ^
                                    | queued gated-action events
                                    |
   ┌─────────────────────────────────────────────────────────┐
   │  devcontainer (workspace-root bind mount only)           │
   │                                                           │
   │   Claude Code session                                    │
   │        │  tool call (Bash / Edit / Write / git / gh)      │
   │        v                                                 │
   │   PreToolUse / PostToolUse hooks   ── classify ──┐        │
   │   (.agents/hooks/*.ts, extended)                 │        │
   │        │                                          │        │
   │  safe/reversible? ── yes ──> execute immediately   │        │
   │        │                                          │        │
   │        no                                          │        │
   │        v                                          │        │
   │  block (exit 2) + append GatedActionEvent ─────────┘        │
   │                                                           │
   │   session end: bd dolt push (--sandbox mode, one push)    │
   └─────────────────────────────────────────────────────────┘
                                    │
                                    v
                       git push (feature branch) + gh pr create
                                    │
                                    v
                    PR against main (mkobit/storagemaxxing)
                                    │
                                    v
              CI (.github/workflows/ci.yml): lint/typecheck/test/
              build-storybook/e2e — now REQUIRED by ruleset 14954375
                                    │
                     ┌──────────────┴───────────────┐
                     v                               v
        bead(s) labeled mode:auto-ok        bead(s) labeled mode:hotl
        + CI green  => mergeable,           => requires explicit human
          no live human required               approval before merge
                     │                               │
                     └──────────────┬───────────────┘
                                    v
                                  main
```

## Domain Objects (Zod)

Two small records cross a tooling boundary and are worth typing now, even though this change does not implement them (illustrative — not verified against a real schema module, per this repo's design-artifact rule on embedded snippets):

```typescript
import { z } from "zod";

// One entry per blocked/queued tool call, appended by the extended hook.
const GatedActionEventSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string().datetime(),
  toolName: z.string(), // e.g. "Bash", "Edit"
  reason: z.enum([
    "force-push",
    "cross-repo-remote",
    "credential-path-read",
    "network-egress-denied",
    "bd-maintenance-op",
    "gate-config-write",
  ]),
  rawCommandOrPath: z.string(), // command string or file path, for human review
  beadId: z.string().optional(),
});
type GatedActionEvent = z.infer<typeof GatedActionEventSchema>;

// Session outcome, drives mode:auto-ok / mode:hotl labeling.
const SandboxSessionOutcomeSchema = z.object({
  sessionId: z.string(),
  beadIds: z.array(z.string()).min(1),
  gatedActionCount: z.number().int().nonnegative(),
  mode: z.enum(["auto-ok", "hotl"]),
  prUrl: z.string().url().optional(),
});
type SandboxSessionOutcome = z.infer<typeof SandboxSessionOutcomeSchema>;
```

`mode` is derived, not chosen by the agent: `gatedActionCount === 0 ? "auto-ok" : "hotl"`, so the label can't be self-reported incorrectly by the same session it's grading.

## Risks / Trade-offs

- **Sandbox escape**: a devcontainer is process isolation, not a hard security boundary equivalent to a VM. If the container image itself is compromised (supply-chain risk in a base image or a `mise`-installed tool), workspace-root scoping alone won't contain it. Out of scope to fully solve here — flagged for the hole-poking pass.
- **Hook bypass via command obfuscation**: `git-commit-main-guard.ts`'s regex-based command matching (`GIT_COMMIT_PATTERN`, `QUOTED_SPAN_PATTERN`) is pattern matching on a shell string, not a real shell parser — it already carries residual risk of a cleverly quoted/escaped command slipping past, and this design multiplies the number of such patterns from one (git commit) to a dozen-plus (push, force flags, credential paths, network hosts, bd maintenance verbs, config file writes). This is the single highest-value thing for an adversarial pass to attack.
- **Egress allowlist completeness**: bun's package registry resolution, GitHub's API, and GitHub's git-over-HTTPS endpoints are not a fixed, tiny IP/host set — getting the allowlist wrong either breaks legitimate installs or leaves an exploitable gap (e.g. a redirect through an allowlisted host to a non-allowlisted one).
- **`mode:hotl` procedural (not ruleset-enforced) human review**: Decision 4 deliberately keeps the human-approval-for-`mode:hotl` rule procedural rather than ruleset-enforced at first. That is a real gap — nothing stops a `mode:hotl` PR from being merged the same "auto-merge on green CI" way as a `mode:auto-ok` one, since GitHub's ruleset can't currently condition on a bead label. Flagged as an open question, not resolved by this design.
- **`bin/` history conclusion could be wrong**: the conclusion that no Docker provider/sandbox wrapper was ever built rests on `git log` against this repository's own history and `bd show`/`bd comments` against the current Dolt DB. It does not rule out work having existed in a different repository, a deleted Dolt branch not reachable from the current one, or a local uncommitted directory on whoever worked sm-lez1's machine that was never pushed anywhere. Stated as the best available evidence, not a certainty.

### Adversarial audit (author's initial pass — NOT a substitute for the required independent hole-poking pass)

This design's author is not an appropriate sole reviewer for a security-sensitive design (sandbox escape, credential leakage, and unattended git push are exactly the failure modes that need genuinely independent scrutiny — self-review is a proofread, not an audit). The points above are flagged, not resolved. Per the `feature-probe` formula, a fresh-context subagent must run the `hole-poking` step (`sm-mol-s7rt`) against this file before any implementation bead is filed, specifically targeting: (1) missing failure scenarios beyond the four listed above, (2) whether the two-layer git-push defense in Decision 3 actually holds against a compromised or confused hook, (3) boundary conditions (empty egress allowlist, a session with zero tool calls, a bead with no `scope:` label), and (4) race conditions if two sandboxed sessions run concurrently against the same repo (the existing `bd --claim` locking model is assumed to still apply, but that assumption is unverified for this specific multi-container scenario).

## Open Questions

- Should `mode:hotl` human-approval-before-merge be promoted from a procedural convention to a ruleset-enforced required-reviewer rule immediately, or only after observing procedural compliance fail at least once? (Leaning toward: ship procedural first, per this repo's general bias toward not over-building before real friction is observed — but this is a security control, so the adversarial pass should weigh in.)
- What identity does a session-scoped bot commit as (`actor:claude-sandbox` in `bd`, but what GitHub committer identity — a machine user, or the GitHub App's bot identity)?
- Exact base image / devcontainer feature set for the container (Dockerfile content) is deliberately left to an implementation bead, not this design.
