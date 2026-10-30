# Guest toolchain and Beads context

The kit installs mise and runs `mise install` in the mounted task worktree.
The committed `mise.toml` and `mise.lock` select Bun and Beads versions.
The installer download, installer execution, and installed mise executable must all succeed before setup continues.
A failed curl pipeline could previously return success because `sh` accepted empty input and later profile commands returned zero.
The kit now downloads the installer to a file and stops on each failure.

The host coordinator owns claims, tracker updates, Git operations, review, and publication.
A guest reads task context with `bd --sandbox --readonly show <id>`.
These flags do not provide access to a database that is outside the mount.
A worktree `.git` pointer to an unmounted host common directory also does not provide tracker access.
Do not mount host credentials or tracker directories to work around this boundary.

When direct access is unavailable, the host coordinator can provide an issue export at `.sbx-task/issues.jsonl` and the assigned issue text at `.sbx-task/context.txt`.
Use the text snapshot to establish the contract before setup.
Only when the coordinator authorizes a disposable context database, run these commands from the guest worktree root:

```bash
mise install
bun scripts/setup-sbx-context.ts
. .sbx-task/beads-context.env
bd --sandbox --readonly show sm-3dfw
bun run check:sbx-env
```

The script uses the installed Beads CLI to initialize and import into a new `.sbx-task/beads-context-*/.beads` directory.
It does not initialize or import into the checkout's `.beads` directory.
It clears inherited Beads backend routing for setup and records the export path, modification time, SHA-256 digest, and setup time in `snapshot.json` beside the context database.
It publishes `beads-context.env` only after a successful import.
Source this file in every shell that needs context access.
Do not add `bd -C`: Beads 1.3.1 uses that flag to select a workspace and overrides `BEADS_DIR`.
Always include `--sandbox --readonly` on guest reads.
The snapshot database has no host remote and is not project state.
The flags are a command contract, not an access control boundary against arbitrary guest writes.
Do not claim, update, close, or sync issues from this database.

To refresh, the host coordinator must produce a new full export from the authoritative tracker and replace `.sbx-task/issues.jsonl` only after export succeeds.
The guest then reruns the setup script and sources the new environment file.
Each setup creates a new database, so removed issues and older local rows cannot survive a refresh.
A failed refresh leaves the previous environment file intact.
Report the snapshot digest and time in the handoff, and ask the host coordinator to check current issue state before publication.
Do not export the guest database back to the host tracker.

Run `bun run check:sbx-env` for the focused tooling tests and static checks.
When the SBX CLI is available, this command also runs `sbx kit validate .sbx/kit --offline` to validate the kit structure without authentication or a daemon.
CI installs the CLI and checks its version before validation, so native structural validation is required there.
Environment files receive static checks for YAML, workspace mounting, local kit references, and forbidden tracked settings.
CI does not sign in to Docker, start a daemon, or provision or execute a sandbox.
Local worker execution remains available through `bun run sbx:plan` and `bun run sbx:test:e2e`, with the normal host authentication and runtime prerequisites.
Run `mise run check` directly inside an existing guest.
Do not create another SBX environment from inside it.
