## ADDED Requirements

### Requirement: Autonomous Safe-Action Set

The sandboxed session SHALL execute a defined set of safe, reversible actions without any human interaction: file edits/writes inside the workspace root, `bun test`/`bun run lint`/`bun run typecheck`/`bunx openspec *`, `bd` claim/comment/create/close operations, `git commit` to a non-`main` branch, `git push` to a non-`main`, non-force-pushed branch of `mkobit/storagemaxxing`, and `gh pr create`/`gh pr edit` against `mkobit/storagemaxxing`.

#### Scenario: Session runs a safe action

- **WHEN** the sandboxed session issues a tool call matching the safe-action set (e.g. `bun test packages/geometry`, or `git commit` on a feature branch)
- **THEN** the action MUST proceed immediately with no approval prompt and no queuing.

### Requirement: Gated Destructive-Action Set

The sandboxed session SHALL block and queue for asynchronous human review any action in a defined destructive/irreversible set, instead of executing it or silently dropping it: `git push --force`/`-f`/`--force-with-lease` on any branch, any git remote operation targeting a repository other than `mkobit/storagemaxxing`, reads of paths matching a secret/credential-pattern denylist, network calls to hosts outside the egress allowlist, `bd rename-prefix`/`bd migrate`/`bd flatten`/`bd compact`/`bd gc`, and any write to `.github/workflows/*`, repository ruleset configuration, or `.claude/settings.json` from within the sandboxed session itself.

#### Scenario: Session attempts a force-push

- **WHEN** the sandboxed session issues a `git push --force` (or `-f`, or `--force-with-lease`) tool call
- **THEN** the hook MUST block the tool call (non-zero exit), append a structured entry to the async review queue, and MUST NOT execute the push.

#### Scenario: Session attempts to widen its own gate

- **WHEN** the sandboxed session attempts to edit `.claude/settings.json`, a file under `.github/workflows/`, or repository ruleset configuration
- **THEN** the hook MUST block the edit regardless of whether the resulting content would itself be reasonable, because a sandboxed session must not be able to loosen the gate that constrains it.

### Requirement: Gate Implemented as an Extension of the Existing Hook Mechanism

The action-gating proxy SHALL be implemented as an extension of the existing `.claude/settings.json` `PreToolUse`/`PostToolUse` hook mechanism (the same mechanism already enforcing `.agents/hooks/git-commit-main-guard.ts`), not as a new, separate approval system.

#### Scenario: New gating rule is added

- **WHEN** a new safe or destructive action pattern is added to the gate
- **THEN** it MUST be implemented as an addition to the `.agents/hooks/*.ts` hook set (or an equivalent `PreToolUse`/`PostToolUse` matcher in `.claude/settings.json`), consistent with the existing `git-commit-main-guard.ts` pattern.

### Requirement: Session Outcome Labeling Reuses `mode:auto-ok`/`mode:hotl`

A sandboxed session SHALL label the bead(s) it worked on `mode:auto-ok` if the session completed with zero queued destructive actions, or `mode:hotl` if at least one action was queued for review, reusing the label taxonomy already defined in `.jules/prompts/delegation-contract.md` rather than introducing a new taxonomy.

#### Scenario: Session completes with a queued action

- **WHEN** a sandboxed session queues at least one destructive action during its run
- **THEN** the linked bead(s) MUST be labeled `mode:hotl` before the session ends, signaling that the resulting PR requires human review before merge rather than being mergeable on CI-green alone.
