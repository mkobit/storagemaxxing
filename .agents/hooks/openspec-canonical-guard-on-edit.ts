#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readHookInput } from "./claude-hook";

const CANONICAL_SPEC_PATTERN = /(?:^|\/)openspec\/specs\/([^/]+)\/spec\.md$/;

const input = await readHookInput();
const path = input.tool_input?.file_path ?? "";
const projectRoot =
  input.workspaceRoot ?? process.env.CLAUDE_PROJECT_DIR ?? ".";

const match = path.match(CANONICAL_SPEC_PATTERN);
if (!match) {
  process.exit(0);
}

const capability = match[1];
const changesDir = join(projectRoot, "openspec", "changes");
const changeEntries = await readdir(changesDir, { withFileTypes: true }).catch(
  () => undefined,
);
if (!changeEntries) {
  process.exit(0);
}

const changeNames = changeEntries
  .filter((entry) => entry.isDirectory() && entry.name !== "archive")
  .map((entry) => entry.name);
const conflictChecks = await Promise.all(
  changeNames.map((name) =>
    Bun.file(join(changesDir, name, "specs", capability, "spec.md")).exists(),
  ),
);
const conflictingChanges = changeNames
  .filter((_, i) => conflictChecks[i])
  .sort();

if (conflictingChanges.length > 0) {
  const names = conflictingChanges.join(", ");
  process.stderr.write(
    `openspec/specs/${capability}/spec.md was edited directly, but active ` +
      `change(s) ${names} already carry a specs/${capability}/spec.md delta. ` +
      "Canonical specs are derived from that delta via `bunx openspec archive` -- " +
      "edit the delta under openspec/changes/<name>/specs/ instead, or CI will " +
      "reject a PR that touches both.\n",
  );
  process.exit(2);
}
