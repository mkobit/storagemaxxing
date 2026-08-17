#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint

import { readHookInput } from "./claude-hook";

const PROTECTED_BRANCH = "main";

const GIT_COMMIT_PATTERN = /\bgit\s+commit\b/;
const BRANCH_CREATE_PATTERN = /\bgit\s+(?:checkout\s+-b|switch\s+-c)\b/;
const QUOTED_SPAN_PATTERN = /"(?:[^"\\]|\\.)*"|'[^']*'/g;

const input = await readHookInput();
const command = input.tool_input?.command ?? "";
const unquotedCommand = command.replace(QUOTED_SPAN_PATTERN, "");

const commitMatch = GIT_COMMIT_PATTERN.exec(unquotedCommand);
if (!commitMatch) {
  process.exit(0);
}

// A branch-creation segment earlier in the same script (e.g. `git checkout -b
// topic && git commit ...`) means the commit will not land on main even
// though this hook fires before any of the script's commands have run.
const precedingCommand = unquotedCommand.slice(0, commitMatch.index);
if (BRANCH_CREATE_PATTERN.test(precedingCommand)) {
  process.exit(0);
}

const projectRoot =
  input.workspaceRoot ?? process.env.CLAUDE_PROJECT_DIR ?? ".";
const proc = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
  cwd: projectRoot,
  stdout: "pipe",
  stderr: "pipe",
});
const [stdout, exitCode] = await Promise.all([
  new Response(proc.stdout).text(),
  proc.exited,
]);
if (exitCode !== 0) {
  process.exit(0);
}

const branch = stdout.trim();
if (branch !== PROTECTED_BRANCH) {
  process.exit(0);
}

process.stderr.write(
  `Refusing to run 'git commit' on local '${PROTECTED_BRANCH}' -- it is ` +
    "branch-protected (GH013) and every commit must land on a topic branch. " +
    "Run 'git checkout -b <topic-branch>' first, then retry the commit.\n",
);
process.exit(2);
