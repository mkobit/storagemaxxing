## ADDED Requirements

### Requirement: Required Status Checks on the Default Ruleset

The `default` branch ruleset on `mkobit/storagemaxxing` (id 14954375) SHALL require the CI jobs defined in `.github/workflows/ci.yml` (`lint`, `typecheck`, `test`, `build-storybook`, `e2e`) to pass before a pull request can merge, in addition to the `pull_request`, `non_fast_forward`, and `deletion` rules it already enforces.

#### Scenario: PR opened by a sandboxed session has a failing check

- **WHEN** a pull request opened by an unattended sandboxed session has a red or not-yet-completed CI run for any of `lint`, `typecheck`, `test`, `build-storybook`, or `e2e`
- **THEN** GitHub MUST refuse to merge the pull request, regardless of who or what triggers the merge attempt.

### Requirement: Human Review Required for `mode:hotl` Sessions

A pull request whose linked bead(s) carry the `mode:hotl` label SHALL require an explicit human approval before merge; a pull request whose linked bead(s) carry only `mode:auto-ok` MAY merge automatically once required status checks are green, consistent with the existing autonomous-merge-on-green-CI convention.

#### Scenario: `mode:hotl` PR passes CI but has no human approval

- **WHEN** a pull request linked to a `mode:hotl`-labeled bead has all required status checks green but has not been approved by a human reviewer
- **THEN** the pull request MUST NOT be merged automatically; merge requires an explicit human approval action first.

#### Scenario: `mode:auto-ok` PR passes CI

- **WHEN** a pull request linked only to `mode:auto-ok`-labeled bead(s) has all required status checks green
- **THEN** the pull request MAY be merged without waiting for a live human review, consistent with the project's existing autonomous-merge-on-green-CI practice.

### Requirement: Merge Queue Serializes Concurrent Auto-Merges

The `default` ruleset on `mkobit/storagemaxxing` SHALL enable a merge queue so that concurrent `mode:auto-ok` pull requests merge serially rather than racing directly against `main`.

#### Scenario: Two `mode:auto-ok` PRs are eligible to merge at the same time

- **WHEN** two or more pull requests linked only to `mode:auto-ok`-labeled bead(s) are simultaneously CI-green and eligible for automatic merge
- **THEN** they MUST be serialized through the merge queue rather than merging directly against a potentially-stale `main`, so each merge is evaluated against the queue's up-to-date state rather than the state at the time its own CI run started.
