#!/usr/bin/env bun

import { readHookInput } from "./claude-hook";

const CHANGE_PATH_PATTERN = /openspec\/changes\/([^/]+)\//;

const input = await readHookInput();
const path = input.tool_input?.file_path ?? "";

const match = path.match(CHANGE_PATH_PATTERN);
if (!match || match[1] === "archive") {
  process.exit(0);
}

const changeName = match[1];
const proc = Bun.spawn(["bunx", "openspec", "validate", changeName, "--strict"], {
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
    `openspec validate ${changeName} --strict failed:\n${stdout}${stderr}`,
  );
  process.exit(2);
}
