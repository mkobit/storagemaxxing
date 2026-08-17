#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint
//
// Warns (does not block, unlike git-commit-main-guard) when 'bd close' runs
// while a prior closed bead's changes are still sitting uncommitted --
// AGENTS.md requires one commit per closed bead, and rapid claim-implement-close
// loops have skipped that in practice (sm-7mi5).

import { readHookInput } from "./claude-hook";

const BD_CLOSE_PATTERN = /\bbd\s+close\b/;
const QUOTED_SPAN_PATTERN = /"(?:[^"\\]|\\.)*"|'[^']*'/g;

const input = await readHookInput();
const command = input.tool_input?.command ?? "";
const unquotedCommand = command.replace(QUOTED_SPAN_PATTERN, "");

if (!BD_CLOSE_PATTERN.test(unquotedCommand)) {
  process.exit(0);
}

const projectRoot =
  input.workspaceRoot ?? process.env.CLAUDE_PROJECT_DIR ?? ".";

async function run(
  cmd: readonly string[],
): Promise<{ readonly stdout: string; readonly exitCode: number }> {
  const proc = Bun.spawn([...cmd], {
    cwd: projectRoot,
    stdout: "pipe",
    stderr: "ignore",
  });
  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  return { stdout, exitCode };
}

const status = await run(["git", "status", "--porcelain"]);
if (status.exitCode !== 0 || status.stdout.trim() === "") {
  process.exit(0);
}

const lastCommit = await run(["git", "log", "-1", "--format=%cI"]);
if (lastCommit.exitCode !== 0 || lastCommit.stdout.trim() === "") {
  process.exit(0);
}
const lastCommitAt = lastCommit.stdout.trim();

const closedSinceCommit = await run([
  "bd",
  "list",
  "--status",
  "closed",
  "--closed-after",
  lastCommitAt,
  "--json",
]);
if (closedSinceCommit.exitCode !== 0) {
  process.exit(0);
}

function parseClosedCount(json: string): number | undefined {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return undefined;
  }
}

const closedCount = parseClosedCount(closedSinceCommit.stdout);
if (closedCount === undefined) {
  process.exit(0);
}

if (closedCount >= 1) {
  process.stderr.write(
    `Warning: ${closedCount} bead(s) already closed since the last commit, and the working ` +
      "tree still has uncommitted changes. AGENTS.md requires a commit per closed bead -- " +
      "commit this bead's changes before closing the next one, or the diffs may become hard " +
      "to separate later.\n",
  );
}
process.exit(0);
