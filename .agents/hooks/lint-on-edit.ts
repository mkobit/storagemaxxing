#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint

import { readHookInput } from "./claude-hook";

const EDITABLE_FILE_PATTERN = /\.(tsx?|jsx?|mts|cts|jsonc?)$/;

const input = await readHookInput();
const path = input.tool_input?.file_path ?? "";
const projectRoot =
  input.workspaceRoot ?? process.env.CLAUDE_PROJECT_DIR ?? ".";

if (EDITABLE_FILE_PATTERN.test(path)) {
  const proc = Bun.spawn(["bunx", "eslint", "--fix", path], {
    cwd: projectRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    process.stderr.write(`eslint --fix ${path} failed:\n${stdout}${stderr}`);
    process.exit(2);
  }
}
