import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

// This is an opt-in snapshot reader setup, never a tracker bootstrap or sync.
const taskDir = resolve(".sbx-task");
const source = join(taskDir, "issues.jsonl");
const snapshot = readFileSync(source);
if (snapshot.length === 0) {
  throw new Error(`The host issue export is empty: ${source}`);
}
const sourceModifiedAt = statSync(source).mtime.toISOString();
mkdirSync(taskDir, { recursive: true });
const contextDir = mkdtempSync(join(taskDir, "beads-context-"));
const beadsDir = join(contextDir, ".beads");
mkdirSync(beadsDir, { mode: 0o700 });
writeFileSync(
  join(beadsDir, "config.yaml"),
  "issue-prefix: sm\nno-git-ops: true\nexport.auto: false\n",
);
const snapshotFile = join(contextDir, "issues.jsonl");
writeFileSync(snapshotFile, snapshot);

// Remove ambient backend routing before invoking the supported Beads CLI.
// In bd 1.3.1, -C selects a workspace and overrides BEADS_DIR, so do not use it.
const backendKeys = Object.keys(process.env).filter((key) =>
  /^(?:BEADS_|BD_)/.test(key),
);
const env = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !backendKeys.includes(key)),
  ),
  BEADS_DIR: beadsDir,
};

function runBd(args: readonly string[]): void {
  const result = Bun.spawnSync(["bd", "--sandbox", ...args], {
    cwd: contextDir,
    env,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Guest context bd ${args[0]} failed (exit ${result.exitCode})`,
    );
  }
}

runBd([
  "init",
  "--prefix",
  "sm",
  "--skip-agents",
  "--skip-hooks",
  "--non-interactive",
]);
runBd(["import", snapshotFile]);
writeFileSync(
  join(contextDir, "snapshot.json"),
  `${JSON.stringify(
    {
      source,
      sourceModifiedAt,
      createdAt: new Date().toISOString(),
      sha256: new Bun.CryptoHasher("sha256").update(snapshot).digest("hex"),
      boundary: "Host export snapshot; local changes are not project state.",
    },
    null,
    2,
  )}\n`,
);

const quote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;
const environmentFile = join(taskDir, "beads-context.env");
const clearedKeys = [...new Set([...backendKeys, "BEADS_DB", "BD_DB"])].filter(
  (key) => /^[A-Z_][A-Z0-9_]*$/.test(key),
);
const pendingEnvironment = join(contextDir, "context.env");
writeFileSync(
  pendingEnvironment,
  `# Host export snapshot; use bd --sandbox --readonly for every read.\nunset ${clearedKeys.join(" ")}\nexport BEADS_DIR=${quote(beadsDir)}\n`,
);
renameSync(pendingEnvironment, environmentFile);
console.log(
  `Guest snapshot ready. Source ${environmentFile}, then run bd --sandbox --readonly show <id>.`,
);
