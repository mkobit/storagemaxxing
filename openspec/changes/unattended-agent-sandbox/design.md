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

Its close reason states: _"OpenSpec change archived. Infrastructure 'winnings' preserved in bin/; further work deferred."_
This claim does not hold up:

- `git log --all -- bin` and `git log --all --diff-filter=D -- 'bin/*'` both return **empty** — no commit in this repository's history, on any branch, has ever touched a `bin/` path.
- The ten child beads (sm-lez1.1 through sm-lez1.10 — "Universal Sandbox Wrapper," "Docker Provider," "SSH Agent Bridge," "GPG Agent Bridge," "User Config Mapping," "Agent-Specific Wrappers," "Sandbox Detection Hook," "Gemini/Claude Integration," "Credential Leak Spike," "Bypass Simulation") all carry identical boilerplate acceptance text (`Requirements defined in design or parent task are met.` / `(Fixed via bulk lint resolution)`), have zero comments, and `bd history sm-lez1` errors out (a NULL-description scan error) rather than showing a real audit trail.
- The actual `design.md`/`tasks.md` content for sm-lez1 (three checkbox items: update `AGENTS.md`, configure `.opencode/settings.json`, ensure Beads auto-commit) is far shallower than what the child bead titles imply was built.
- The one repo commit that mentions "sandbox" near this timeframe (`b95db3e`, "autonomous Jules dispatch + sandbox fix") is about a different concept — Jules's snapshot-sandbox drift defense (git checkout/clean before scoping a diff) — not a Docker provider or credential bridge.

**Conclusion**: there is no verifiable evidence a Docker provider, universal sandbox wrapper, or SSH/GPG agent bridge was ever built in this repo. The close note's `bin/` claim is either aspirational, describes work done in a different (uncommitted, or since-deleted-without-trace) location, or is simply inaccurate. This design does not attempt to recover or assume the existence of that unverified work. It designs the container mechanism from scratch, and it explicitly does **not** reuse the SSH/GPG agent bridge concept (see Decisions, Credential Scoping) — bridging a human's host signing keys into a container built for _unattended_ execution runs directly counter to this change's own goal.

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
- Restricts outbound network to an explicit allowlist: GitHub (git + REST/GraphQL API) and the bun package registry. `WebFetch`/`WebSearch` tools are disabled (or routed through the same allowlist check) for unattended sessions — an unattended agent has no human present to notice a prompt-injection payload from an arbitrary fetched page. The same allowlist applies during toolchain bootstrap (`mise install`) as during the live session — no separate, wider bootstrap-time carve-out; if `mise`/`bun`/`bd` installation needs a host beyond GitHub + the bun registry (e.g. a release CDN), that host must be named explicitly in the allowlist rather than left implicit.
- Enforces the egress allowlist from **outside** the sandboxed process's own network namespace (host-level Docker network policy or a proxy sidecar with a separate namespace) — not via `iptables`/`nftables` rules run with `NET_ADMIN` _inside_ the container the agent's own tool calls can reach, since that would hand the same untrusted principal the capability to unset its own restriction.
- Runs `bd` in `--sandbox` mode for the session; the session's last `bd`-related action is exactly one `bd dolt push` (mirrors the Jules "push once, at the end" rule, verified as already load-bearing in `delegation-contract.md` — omitting it there is called out as fatal for research-only output). The session also runs `bd dolt pull` immediately before every `bd update --claim` (not only once at container start), to shrink — not eliminate — the window in which two concurrently-running sandboxed sessions both see the same bead as unclaimed. This does not fully solve concurrent-container Dolt sync (see Risks and Open Questions): whether `bd`'s claim operation has any compare-and-swap/conflict-detection semantics against a remote that changed since the last pull is unverified and is called out as an open question rather than assumed.

### 2. Approval model: extend the existing hook proxy, classify actions into two sets

No new approval system. `.agents/hooks/git-commit-main-guard.ts`'s pattern (a `PreToolUse` hook on the `Bash` matcher, reading `tool_input.command`, exiting `2` to block) is generalized into a broader rule set covering the action classes below, reusing the same `readHookInput` helper (`.agents/hooks/claude-hook.ts`) already shared across the four `PostToolUse` hooks.

**Autonomous / safe set** (proceeds immediately, no prompt):
file edits/writes inside the workspace root **and inside the path(s) implied by the claimed bead's `scope:` label** (a write outside declared scope is not blocked outright — legitimate cross-cutting fixes exist — but is routed to the gated set as a `scope-drift` event instead of executing silently, matching Jules's path-allowlist precedent instead of the unconditional "anywhere in the workspace root" this design started with); `bun test` / `bun run lint` / `bun run typecheck` / `bunx openspec *`; `bd` claim/comment/create/close; `git commit` to a non-`main` branch; `git push` to a non-`main`, non-force-pushed branch of `mkobit/storagemaxxing` (destination resolved via `git remote get-url <remote>`, the same "shell out and check real state" pattern the existing hook already uses for the current branch — not string-matched against the command text, since the target remote/branch is often absent from the command string itself, e.g. `git push origin main` after an earlier `git remote add origin ...`); `gh pr create` / `gh pr edit` against `mkobit/storagemaxxing`.
This is close to today's `.claude/settings.local.json` allowlist already, generalized from a flat command-string allowlist into a hook so new safe commands don't require hand-editing a settings file every time.
**A tool call matching neither the safe set nor an enumerated gated pattern below is treated as gated by default (fail closed, queued for review), not executed by default (fail open).** The two-set framing in the original design implied exhaustiveness it didn't have; `gh pr merge` (found by the independent hole-poking pass, sm-mol-s7rt) matched neither set and would otherwise have executed silently.

**Gated / destructive set** (hook blocks the tool call, exit `2`, appends a structured event — see Zod schema below — to an async review queue instead of executing):
`git push --force`/`-f`/`--force-with-lease` on any branch; any git remote operation targeting a repository other than `mkobit/storagemaxxing`; reads matching a credential-pattern denylist (`.env`, `**/*credentials*`, `~/.ssh/**`, `~/.gnupg/**` — belt-and-suspenders, since these paths should not even be mounted per Decision 1); network calls outside the egress allowlist; `bd rename-prefix` / `bd migrate` / `bd flatten` / `bd compact` / `bd gc`; **`bd delete`**; any write to `.github/workflows/*`, ruleset config, `.claude/settings*.json`, or **`.agents/hooks/**` itself** (a sandboxed session must not be able to loosen its own gate by editing the pointer _or_ the pointee — protecting only `.claude/settings.json` while leaving the hook script it references freely editable was a gap the independent hole-poking pass found live: the hook is a normal tracked file under the workspace root, and the original safe set unconditionally authorized edits there); **`gh pr merge`/`gh pr merge --auto` against any PR** (closes a second gap the hole-poking pass found: with `pull-requests:write` scope, the injected token can merge, so without this the session could self-merge its own `mode:hotl` PR at end-of-run and defeat the human-approval requirement Decision 4 depends on).

A session that ends having queued zero gated actions labels its bead(s) `mode:auto-ok`; a session that queued at least one labels `mode:hotl` — reusing the exact taxonomy `.jules/prompts/delegation-contract.md` already defines, giving it a second consumer instead of a Claude-specific label scheme.

**Honest scope of this mechanism**: the independent hole-poking pass (sm-mol-s7rt) also found that regex/string-matching a Bash command is defeatable by a sufficiently determined session — writing the actual destructive command into a file via the (safe) `Write` tool and executing it with `bash script.sh`, or building a flag via shell variable/command substitution (`F=--force; git push origin main "$F"`) — and that no amount of adding more patterns closes this category, because it's a structural limit of pattern-matching a string rather than actually parsing and simulating shell semantics. This design does not claim the hook is an airtight boundary against an adversarial or compromised session; it is a speed bump and audit trail against _accidental_ destructive actions from a good-faith session, not a substitute for the real containment this design already provides independently of the hook: workspace-root-only mounting, no host credentials, a single short-TTL repo-scoped token, and `main` still platform-protected by the GH013 ruleset regardless of what the hook does or doesn't catch. If the hook is bypassed, blast radius is capped by those other layers, not by the hook itself. This reframing is an explicit decision this design is making, not a gap left open — a human reviewer should sign off on treating the hook as defense-in-depth rather than a primary security boundary before this ships.

### 3. Credential scoping

- GitHub: fine-grained PAT or GitHub App installation token, `mkobit/storagemaxxing`-only, `contents:write` + `pull-requests:write`, no `admin:*`, no other-repo scope, short TTL.
- Git push: defense in depth at two layers — (a) the GH013 ruleset already blocks direct-push/force-push/deletion on `main` at the platform level regardless of token scope (`current_user_can_bypass: never`), (b) the hook additionally refuses to even attempt a `git push` matching `main` or a force flag, so the destructive attempt never reaches GitHub and gets queued for review instead of bouncing off a platform-level 403.
- No host SSH/GPG bridge (see Non-Goals). Commits from the sandbox are attributed to a session-scoped bot identity (`actor:claude-sandbox` in `bd`'s audit trail, distinct from the interactive `actor:claude`), not signed with the human operator's personal key.
- No other host credentials (cloud provider, npm token beyond what's needed for public registry reads, etc.) are injected.
- **Accepted residual risk, not solved by this design**: the credential-path-read denylist (Decision 2) is file-glob-based and cannot see the one credential this design actually injects, since it's delivered as an environment variable (the standard devcontainer mechanism), not a file — `printenv`/`env` matches no glob pattern and isn't a filesystem read at all. Similarly, the egress allowlist is destination-based, not content-based, and GitHub's own REST/GraphQL API — fully allowlisted, since the session needs it for legitimate `gh`/git operations — is itself a usable exfiltration sink for that token or any other file content (e.g. `gh api repos/.../issues -f body="$(env | base64)"`). Both gaps were found by the independent hole-poking pass (sm-mol-s7rt) and are not fixable by extending the gate's pattern-matching, for the same structural reason noted in Decision 2. The actual mitigation is minimizing what leaking the token can do, not detecting the leak: short session-length TTL, single-repo scope, no `admin:*`, so a leaked token is only ever as dangerous as the safe/gated action set already allows a live session to do — and revoking it at session end (not just letting it expire) further shrinks the exposure window and should be an explicit implementation requirement, not left implicit.

### 4. PR as checkpoint: close the required-status-checks gap, keep review conditional

- Add a `required_status_checks` rule to ruleset `14954375` naming `lint`, `typecheck`, `test`, `build-storybook`, `e2e` (the job names already in `.github/workflows/ci.yml`) — this is the concrete fix for the gap found in Context: today's ruleset requires a PR to exist but not to be green.
- Merge eligibility is then conditional on the session's own `mode:auto-ok`/`mode:hotl` labeling: `mode:auto-ok` + required checks green is mergeable without a live human (matching the existing "autonomous merge on green CI" convention already in practice for other work); `mode:hotl` requires an explicit human approval first. This split is intentionally not yet a `required_approving_review_count` ruleset change — start procedural (PR template / convention), promote to a ruleset-enforced required-reviewer rule later if procedural compliance proves unreliable in practice. Flagged as an open question below. Note this convention governs a _human's_ own later merge action on a `mode:hotl` PR — it is separate from, and does not by itself prevent, a sandboxed session merging its own PR from _inside_ the session; that specific self-merge path is closed by gating `gh pr merge` in Decision 2, since the session's own token can no longer execute a merge regardless of what label it applied to its own bead.
- Two `mode:auto-ok` sessions running concurrently can both have green-CI PRs eligible for unattended merge at the same time; without serialization, the second PR's CI ran against a `main` that goes stale the instant the first merges — a non-conflicting diff can still be a semantically-broken combination. Enable GitHub's native merge queue on ruleset `14954375` (in addition to the required status checks added above) so concurrent auto-ok merges serialize through it rather than racing directly against `main`, instead of building bespoke serialization logic for a problem GitHub's platform already solves.
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
    "pr-merge-attempt", // gh pr merge / gh pr merge --auto, from any session (closes sm-mol-s7rt finding)
    "scope-drift", // write outside the claimed bead's scope: label path
    "unmatched-fail-closed", // tool call matched neither the safe nor an enumerated gated pattern
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

The review queue is stored as one append-only file per `sessionId`, not a single shared file all containers append to — concurrent sandboxed sessions writing a shared file is a non-atomic-append race that can silently interleave or drop entries (found by sm-mol-s7rt); per-session files sidestep the race entirely since no two sessions ever write the same file, and the human-review tool aggregates across files at read time instead of relying on write-time atomicity.

## Risks / Trade-offs

- **Sandbox escape**: a devcontainer is process isolation, not a hard security boundary equivalent to a VM. If the container image itself is compromised (supply-chain risk in a base image or a `mise`-installed tool), workspace-root scoping alone won't contain it. Out of scope to fully solve here — the independent hole-poking pass did not find a specific concrete escape beyond this general class, so it remains an accepted, named residual risk rather than a resolved one.
- **Hook bypass via command obfuscation, confirmed live, not fully closable**: the independent pass confirmed write-then-execute (`Write` a script, run it via `Bash`) and shell variable/command-substitution indirection both defeat string-pattern matching regardless of how many patterns are added, and that a remote's actual destination isn't always present in the command string (fixed for the one case that is cheaply fixable — resolving via `git remote get-url`, Decision 2). The rest is not fixable by extending the pattern list, which is why Decision 2 now states explicitly that the hook is defense-in-depth against accidental actions, not a primary boundary against an adversarial one — see Decision 2's "Honest scope of this mechanism."
- **Egress allowlist completeness**: bun's package registry resolution, GitHub's API, and GitHub's git-over-HTTPS endpoints are not a fixed, tiny IP/host set — getting the allowlist wrong either breaks legitimate installs or leaves an exploitable gap (e.g. a redirect through an allowlisted host to a non-allowlisted one). Additionally, the independent pass found the allowlisted GitHub API is itself a content-agnostic exfiltration sink (any allowlisted destination can carry arbitrary uploaded content, not just the traffic it's allowlisted for) — see Decision 3's credential-scoping residual-risk note; this is not solvable by refining the host list, since the host itself is legitimately needed.
- **`mode:hotl` procedural (not ruleset-enforced) human review**: Decision 4 deliberately keeps the human-approval-for-`mode:hotl` rule procedural rather than ruleset-enforced at first, for a _human's_ own later merge action. The independent pass's more severe version of this gap — a sandboxed session merging its **own** `mode:hotl` PR from inside the session, bypassing the human step entirely — is closed by gating `gh pr merge` (Decision 2). The procedural-vs-ruleset question for a human's own workflow remains open (see Open Questions).
- **`bin/` history conclusion could be wrong**: the conclusion that no Docker provider/sandbox wrapper was ever built rests on `git log` against this repository's own history and `bd show`/`bd comments` against the current Dolt DB. It does not rule out work having existed in a different repository, a deleted Dolt branch not reachable from the current one, or a local uncommitted directory on whoever worked sm-lez1's machine that was never pushed anywhere. Stated as the best available evidence, not a certainty.
- **bd/Dolt concurrency across concurrent sandboxed sessions is a real, only partially mitigated gap** (new, found by the independent pass): two containers can both `bd dolt pull`, both see the same bead unclaimed, both claim it, and the later `bd dolt push` can silently overwrite the earlier session's claim/close/comments with no conflict surfaced to either side. Decision 1's "pull immediately before every claim" narrows the race window but does not close it, because whether `bd` has any compare-and-swap/conflict-detection semantics for a claim against a remote that changed since the last pull is unverified. Not resolved by this design — see Open Questions.
- **Credential exposure via environment variable and API-based exfiltration are accepted, not solved**: see Decision 3. Detection-based mitigation (denylist, egress allowlist) structurally cannot see either path; the design instead minimizes blast radius via token scope/TTL.

### Independent adversarial audit (sm-mol-s7rt, fresh-context subagent — completed)

An independent, fresh-context subagent (not the author of this design) ran the mandatory hole-poking pass required by the `feature-probe` formula before any implementation bead may be filed. It read `proposal.md`, `design.md`, `README.md`, all three `specs/*/spec.md`, and the real `.agents/hooks/*.ts` implementation, and targeted the four areas this design's own prior "author's initial pass" flagged, plus multi-agent race conditions and general boundary-condition analysis.

Findings and how each was addressed above:

- **Critical** — safe set let a session edit `.agents/hooks/**` itself (the pointee), even though `.claude/settings.json` (the pointer) was protected → closed: `.agents/hooks/**` added to the gated set (Decision 2).
- **Critical** — `gh pr merge` matched neither the safe nor gated set, so the injected `pull-requests:write` token could self-merge a session's own `mode:hotl` PR → closed: `gh pr merge`/`gh pr merge --auto` added to the gated set, plus a fail-closed default for any unmatched tool call (Decision 2).
- **High** — the one injected credential (GitHub token, an env var) isn't covered by the file-glob credential-read denylist → accepted residual risk, mitigated by scope/TTL, not detection (Decision 3).
- **High** — the allowlisted GitHub API is itself a usable exfiltration sink → accepted residual risk, same mitigation as above (Decision 3).
- **High** — write-then-execute defeats the Bash regex gate → accepted, reframed: the hook is defense-in-depth against accidental actions, not the primary boundary (Decision 2, "Honest scope of this mechanism").
- **High** — `git push <remote>`'s real destination isn't always in the command string → closed: destination resolved via `git remote get-url`, mirroring the existing hook's branch-resolution pattern (Decision 2).
- **High** — shell variable/command-substitution indirection defeats flag-matching regexes → accepted under the same reframing as write-then-execute; not closable by pattern-matching (Decision 2).
- **High** — bd/Dolt concurrency model across concurrent containers was entirely unspecified → partially closed (pull-before-claim narrows the window), residual race explicitly named and left as an open question (Decision 1, Risks, Open Questions).
- **Medium** — GatedActionEvent queue storage/concurrency unspecified, risking silently dropped audit entries under concurrent writes → closed: one append-only file per `sessionId`, no shared-file write race (Domain Objects).
- **Medium** — no merge queue means concurrent `mode:auto-ok` auto-merges can race against a moving `main` → closed: recommend enabling GitHub's native merge queue on the ruleset (Decision 4).
- **Medium** — network-egress enforcement needs a boundary the agent doesn't itself control → closed: enforcement moved explicitly outside the sandboxed process's own network namespace (Decision 1).
- **Medium** — toolchain-bootstrap egress vs. session-time egress were conflated → closed: same allowlist applies to both, any additional bootstrap host must be named explicitly (Decision 1).
- **Medium** — the design claimed to inherit Jules's trust model but dropped its scope-based path allowlist → closed: safe-set file writes are now additionally scoped to the claimed bead's `scope:` label, with out-of-scope writes gated as `scope-drift` rather than unconditionally allowed (Decision 2).
- **Low** — assorted boundary conditions (empty/misconfigured egress allowlist, unmatched-action default, `bd delete` unclassified) → closed: fail-closed default for unmatched actions (Decision 2), `bd delete` added to the gated set (Decision 2); empty/misconfigured allowlist default-deny is a property of enforcing egress at the host/proxy layer (Decision 1) rather than the agent-side hook, and is an implementation-bead concern for the exact proxy/firewall configuration.

The auditor also confirmed several mechanisms hold up as designed: mode derivation is not self-reportable, workspace-root isolation is enforced via physical non-existence of the path rather than a policy check, the two-layer git-push defense is sound for the branch-name/force-flag dimension, and CI's existing `pull_request` (not `pull_request_target`) trigger with `contents: read` permissions means no secret-exposure-to-fork-PR risk was introduced by this design.

## Open Questions

- Should `mode:hotl` human-approval-before-merge be promoted from a procedural convention to a ruleset-enforced required-reviewer rule immediately, or only after observing procedural compliance fail at least once? (Leaning toward: ship procedural first, per this repo's general bias toward not over-building before real friction is observed — this now governs only a human's own later merge action, since the more severe self-merge-from-inside-the-session path is closed.)
- Does `bd` have any compare-and-swap or conflict-detection semantics on `--claim` against a remote that changed since the last `bd dolt pull`? If not, this design's "pull before every claim" mitigation only narrows the concurrent-container race, it doesn't close it — closing it fully may need a follow-up bead against `bd` itself, or a lock/serialization mechanism this design would need to add on top.
- What identity does a session-scoped bot commit as (`actor:claude-sandbox` in `bd`, but what GitHub committer identity — a machine user, or the GitHub App's bot identity)?
- Exact base image / devcontainer feature set for the container (Dockerfile content), and the exact mechanism/product used to enforce network egress from outside the sandboxed process's namespace (host Docker network policy vs. a proxy sidecar), are deliberately left to an implementation bead, not this design.
