#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .claude is in root tsconfig.json include)
// and: bun run lint (eslint ignores .claude/**, matching the scripts/** precedent)

type HookInput = {
  readonly tool_input?: {
    readonly file_path?: string;
  };
};

const EDITABLE_FILE_PATTERN = /\.(tsx?|jsx?|mts|cts|jsonc?)$/;

const input = (await Bun.stdin.json()) as HookInput;
const path = input.tool_input?.file_path ?? "";
const projectRoot = process.env.CLAUDE_PROJECT_DIR ?? ".";

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
