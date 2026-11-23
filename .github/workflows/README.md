# GitHub Actions workflows

## Overview

Workflows in this directory pin external GitHub Actions dependencies in [actions.lock](./actions.lock).
[verify-lockfile.yml](./verify-lockfile.yml) verifies lockfile pins on pull requests and pushes to `main` using `contents: read` permissions.
[Dependabot configuration](../dependabot.yml) schedules weekly `github-actions` updates in the `actions` group with a 21-day cooldown.

## Refresh and verification

Run these commands from the repository root with the `github/gh-actions-lock` `gh` extension installed.

Inspect workflows without modifying files:

```sh
gh actions-lock --no-fix
```

Update [actions.lock](./actions.lock) after adding or updating workflow action references:

```sh
gh actions-lock
```

Verify that [actions.lock](./actions.lock) matches all workflows and upstream commits without writing files:

```sh
gh actions-lock --verify
```
