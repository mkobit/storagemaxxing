#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "git-commit-main-guard.ts");

let fixtureRepo: string;

async function run(cmd: readonly string[], cwd: string): Promise<void> {
  const proc = Bun.spawn([...cmd], { cwd, stdout: "ignore", stderr: "ignore" });
  await proc.exited;
}

async function runGuard(
  command: string,
): Promise<{ readonly exitCode: number; readonly stderr: string }> {
  const proc = Bun.spawn(["bun", HOOK_PATH], {
    cwd: fixtureRepo,
    env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRepo },
    stdin: "pipe",
    stdout: "ignore",
    stderr: "pipe",
  });
  proc.stdin.write(JSON.stringify({ tool_input: { command } }));
  proc.stdin.end();
  const [stderr, exitCode] = await Promise.all([
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, stderr };
}

// The guard shells out to `git rev-parse --abbrev-ref HEAD` in CLAUDE_PROJECT_DIR
// and treats a non-zero exit (e.g. an unborn branch with no commits) as "allow" --
// so the fixture needs a real commit before it reliably resolves to "main".
beforeAll(async () => {
  fixtureRepo = mkdtempSync(join(tmpdir(), "guard-test-"));
  await run(["git", "init", "-b", "main", "-q", fixtureRepo], fixtureRepo);
  await run(
    [
      "git",
      "-c",
      "user.email=test@test.com",
      "-c",
      "user.name=test",
      "commit",
      "--allow-empty",
      "-q",
      "-m",
      "init",
    ],
    fixtureRepo,
  );
});

afterAll(() => {
  rmSync(fixtureRepo, { recursive: true, force: true });
});

describe("git-commit-main-guard", () => {
  test("bare git commit on main blocks", async () => {
    const { exitCode, stderr } = await runGuard('git commit -m "test"');
    expect(exitCode).toBe(2);
    expect(stderr).toContain("Refusing to run 'git commit'");
  });

  test("git checkout -b followed by commit allows", async () => {
    const { exitCode } = await runGuard(
      'git checkout -b topic && git add . && git commit -m "test"',
    );
    expect(exitCode).toBe(0);
  });

  test("git switch -c followed by commit allows", async () => {
    const { exitCode } = await runGuard(
      'git switch -c topic-branch && git commit -m "test"',
    );
    expect(exitCode).toBe(0);
  });

  test("commit before checkout -b still blocks", async () => {
    const { exitCode } = await runGuard(
      'git commit -m "test" && git checkout -b topic',
    );
    expect(exitCode).toBe(2);
  });

  test("checkout -b mentioned only inside a quoted commit message does not bypass the guard", async () => {
    const { exitCode } = await runGuard(
      'git commit -m "see git checkout -b docs"',
    );
    expect(exitCode).toBe(2);
  });
});
