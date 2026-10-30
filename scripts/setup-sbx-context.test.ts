import { afterEach, expect, test } from "bun:test";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const scratch = resolve(".sbx-task");
mkdirSync(scratch, { recursive: true });
const dirs: string[] = [];
afterEach(() =>
  dirs
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);

function fixture(failImport = false) {
  const dir = mkdtempSync(join(scratch, "sbx-context-test-"));
  dirs.push(dir);
  mkdirSync(join(dir, ".beads"));
  mkdirSync(join(dir, ".sbx-task"));
  writeFileSync(join(dir, ".beads/metadata.json"), "host sentinel");
  writeFileSync(
    join(dir, ".sbx-task/issues.jsonl"),
    '{"id":"sm-test","title":"Context"}\n',
  );
  writeFileSync(
    join(dir, "bd"),
    `#!/bin/sh
set -eu
case "$BEADS_DIR" in "${dir}"/.sbx-task/beads-context-*/.beads) ;; *) exit 90 ;; esac
[ -z "\${BEADS_DB:-}" ] && [ -z "\${BD_DB:-}" ] || exit 91
printf '%s\\n' "$*" >> "${dir}/calls"
case "$*" in *-C*|*sync*|*push*|*pull*) exit 92 ;; esac
${failImport ? 'case "$*" in *import*) exit 23 ;; esac' : ""}
`,
  );
  chmodSync(join(dir, "bd"), 0o755);
  return dir;
}

function setup(dir: string) {
  return Bun.spawnSync(
    [process.execPath, resolve("scripts/setup-sbx-context.ts")],
    {
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        BEADS_DB: "host-db",
        BD_DB: "host-db",
      },
    },
  );
}

test("context setup imports only into a fresh guest directory and records the snapshot", () => {
  const dir = fixture();
  expect(setup(dir).exitCode).toBe(0);
  expect(readFileSync(join(dir, ".beads/metadata.json"), "utf8")).toBe(
    "host sentinel",
  );
  const calls = readFileSync(join(dir, "calls"), "utf8");
  expect(calls).toContain(
    "--sandbox init --prefix sm --skip-agents --skip-hooks --non-interactive",
  );
  expect(calls).toContain("--sandbox import");
  expect(calls).not.toContain("--readonly import");
  const context = readdirSync(join(dir, ".sbx-task")).find((name) =>
    name.startsWith("beads-context-"),
  )!;
  const manifest = JSON.parse(
    readFileSync(join(dir, ".sbx-task", context, "snapshot.json"), "utf8"),
  );
  expect(manifest.sha256).toBe(
    new Bun.CryptoHasher("sha256")
      .update(readFileSync(join(dir, ".sbx-task/issues.jsonl")))
      .digest("hex"),
  );
  expect(
    readFileSync(join(dir, ".sbx-task/beads-context.env"), "utf8"),
  ).toContain("export BEADS_DIR=");
});

test("a failed import does not publish a context environment", () => {
  const dir = fixture(true);
  expect(setup(dir).exitCode).not.toBe(0);
  expect(readdirSync(join(dir, ".sbx-task"))).not.toContain(
    "beads-context.env",
  );
});

test("a failed refresh preserves the previous usable snapshot selection", () => {
  const dir = fixture(true);
  const environmentFile = join(dir, ".sbx-task/beads-context.env");
  writeFileSync(environmentFile, "previous snapshot\n");
  expect(setup(dir).exitCode).not.toBe(0);
  expect(readFileSync(environmentFile, "utf8")).toBe("previous snapshot\n");
});

test("refresh builds a new database instead of merging into the old snapshot", () => {
  const dir = fixture();
  expect(setup(dir).exitCode).toBe(0);
  const environmentFile = join(dir, ".sbx-task/beads-context.env");
  const firstEnvironment = readFileSync(environmentFile, "utf8");
  expect(setup(dir).exitCode).toBe(0);
  expect(readFileSync(environmentFile, "utf8")).not.toBe(firstEnvironment);
});

test("a missing export fails before any tracker command", () => {
  const dir = fixture();
  rmSync(join(dir, ".sbx-task/issues.jsonl"));
  expect(setup(dir).exitCode).not.toBe(0);
  expect(readdirSync(dir)).not.toContain("calls");
});
