#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)

import { join } from "node:path";
import { readHookInput } from "./claude-hook";

const TYPECHECKED_FILE_PATTERN = /\.(tsx?|mts|cts)$/;
const PACKAGE_SCOPE_PATTERN = /(?:^|\/)(packages|apps)\/([^/]+)\//;

const input = await readHookInput();
const path = input.tool_input?.file_path ?? "";
const projectRoot = process.env.CLAUDE_PROJECT_DIR ?? ".";

if (!TYPECHECKED_FILE_PATTERN.test(path)) {
  process.exit(0);
}

const scopeMatch = path.match(PACKAGE_SCOPE_PATTERN);
const tsconfig = scopeMatch
  ? `${scopeMatch[1]}/${scopeMatch[2]}/tsconfig.json`
  : "tsconfig.json";

if (!(await Bun.file(join(projectRoot, tsconfig)).exists())) {
  process.exit(0);
}

const proc = Bun.spawn(["bunx", "tsc", "--noEmit", "-p", tsconfig], {
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
  process.stderr.write(
    `tsc --noEmit -p ${tsconfig} failed:\n${stdout}${stderr}`,
  );
  process.exit(2);
}
