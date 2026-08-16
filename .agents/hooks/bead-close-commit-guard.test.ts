#!/usr/bin/env bun
// Sanity check: bun run typecheck (tsc --noEmit, .agents/hooks is in root tsconfig.json include)
// and: bun run lint

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "bead-close-commit-guard.ts");

let fixtureRepo: string;
let fixtureBin: string;

async function run(cmd: readonly string[], cwd: string): Promise<void> {
  const proc = Bun.spawn([...cmd], { cwd, stdout: "ignore", stderr: "ignore" });
  await proc.exited;
}

async function runGuard(
  command: string,
  bdClosedCountJson: string,
): Promise<{ readonly exitCode: number; readonly stderr: string }> {
  const proc = Bun.spawn(["bun", HOOK_PATH], {
    cwd: fixtureRepo,
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: fixtureRepo,
      PATH: `${fixtureBin}:${process.env.PATH ?? ""}`,
      BD_STUB_CLOSED_JSON: bdClosedCountJson,
    },
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

beforeAll(async () => {
  fixtureRepo = mkdtempSync(join(tmpdir(), "bead-guard-test-"));
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

  fixtureBin = mkdtempSync(join(tmpdir(), "bead-guard-bin-"));
  const bdStubPath = join(fixtureBin, "bd");
  writeFileSync(bdStubPath, '#!/usr/bin/env bash\necho "$BD_STUB_CLOSED_JSON"\n');
  chmodSync(bdStubPath, 0o755);
});

afterAll(() => {
  rmSync(fixtureRepo, { recursive: true, force: true });
  rmSync(fixtureBin, { recursive: true, force: true });
});

describe("bead-close-commit-guard", () => {
  test("non-bd-close command exits clean without touching bd", async () => {
    const { exitCode, stderr } = await runGuard("git status", '["should-not-be-read"]');
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
  });

  test("bd close with a clean working tree exits clean", async () => {
    await run(["git", "checkout", "-q", "main"], fixtureRepo);
    await run(["git", "clean", "-fdq"], fixtureRepo);
    const { exitCode, stderr } = await runGuard('bd close sm-1 --reason "done"', "[]");
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
  });

  test("bd close with uncommitted changes and no prior closes exits clean", async () => {
    writeFileSync(join(fixtureRepo, "dirty.txt"), "uncommitted\n");
    const { exitCode, stderr } = await runGuard('bd close sm-2 --reason "done"', "[]");
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    rmSync(join(fixtureRepo, "dirty.txt"));
  });

  test("bd close with uncommitted changes and a prior close warns but does not block", async () => {
    writeFileSync(join(fixtureRepo, "dirty.txt"), "uncommitted\n");
    const { exitCode, stderr } = await runGuard(
      'bd close sm-3 --reason "done"',
      '[{"id": "sm-2"}]',
    );
    expect(exitCode).toBe(0);
    expect(stderr).toContain("already closed since the last commit");
    rmSync(join(fixtureRepo, "dirty.txt"));
  });
});
