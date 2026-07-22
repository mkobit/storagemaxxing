#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint (eslint ignores .agents/hooks/**, matching the scripts/** precedent)
export {};

const PROTECTED_BRANCH = "main";

type HookInput = {
  readonly tool_input?: {
    readonly command?: string;
  };
};

const GIT_COMMIT_PATTERN = /\bgit\s+commit\b/;

const input = (await Bun.stdin.json()) as HookInput;
const command = input.tool_input?.command ?? "";

if (!GIT_COMMIT_PATTERN.test(command)) {
  process.exit(0);
}

const projectRoot = process.env.CLAUDE_PROJECT_DIR ?? ".";
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
