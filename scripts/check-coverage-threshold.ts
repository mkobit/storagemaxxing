// Advisory-only coverage gate (openspec/changes/archive/2026-08-13-ci-quality-gates/design.md
// Decision 2/4): runs each invocation's own `bun test --coverage` and checks
// every per-file row against a threshold, independently of the existing
// blocking `test` job. Does NOT set bunfig.toml's coverageThreshold -- that
// would fail `bun test --coverage` on a coverage miss using the same exit
// code as a real test failure, conflating the two.
// This script's own exit code is meant to be wrapped in `continue-on-error:
// true` at the CI-step level during the advisory period (sm-jb1j flips it).
//
// Bun's coverageThreshold gates on the worst individual file in the
// invocation, not the aggregate "All files" row (sm-f2qq) -- so this script
// mirrors that per-file behavior. Threshold keys use Bun's own bunfig.toml
// names (functions/lines, plural) rather than the singular names design.md
// used, which TOML accepts but Bun silently ignores.

export {};

type CoverageThreshold = {
  readonly functions: number;
  readonly lines: number;
};

type Invocation = {
  readonly label: string;
  readonly command: readonly string[];
  readonly threshold: CoverageThreshold;
};

const INVOCATIONS: readonly Invocation[] = [
  {
    label: "packages + hooks",
    command: ["bun", "test", "packages", "./.agents/hooks", "--coverage"],
    threshold: { functions: 0.85, lines: 0.9 },
  },
  {
    label: "apps/web",
    command: ["bun", "--cwd", "apps/web", "test", "src", "--coverage"],
    threshold: { functions: 0.8, lines: 0.85 },
  },
];

const COVERAGE_ROW = /^ ?(\S.*?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/gm;
const AGGREGATE_ROW_NAME = "All files";

type FileCoverage = CoverageThreshold & { readonly file: string };

function parseCoverage(output: string): readonly FileCoverage[] {
  return [...output.matchAll(COVERAGE_ROW)].map(
    ([, file, functions, lines]) => ({
      file: file.trim(),
      functions: Number(functions) / 100,
      lines: Number(lines) / 100,
    }),
  );
}

async function runInvocation(invocation: Invocation): Promise<{
  readonly rows: readonly FileCoverage[];
  readonly exitCode: number;
}> {
  const proc = Bun.spawn([...invocation.command], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { rows: parseCoverage(stdout + stderr), exitCode };
}

function reportLine(row: FileCoverage, threshold: CoverageThreshold): string {
  const pct = (n: number): string => `${(n * 100).toFixed(2)}%`;
  const status =
    row.functions >= threshold.functions && row.lines >= threshold.lines
      ? "OK"
      : "MISS";
  return `    ${row.file.padEnd(48)} funcs ${pct(row.functions).padStart(7)} / lines ${pct(row.lines).padStart(7)} ${status}`;
}

async function main(): Promise<number> {
  const results = await Promise.all(
    INVOCATIONS.map(async (invocation) => ({
      invocation,
      ...(await runInvocation(invocation)),
    })),
  );

  const misses = results.flatMap(({ invocation, rows, exitCode }) => {
    console.log(`${invocation.label} (exit ${exitCode}):`);
    if (rows.length === 0) {
      console.log("    could not parse coverage output -- treating as a miss");
      return [invocation.label];
    }

    const aggregate = rows.find((row) => row.file === AGGREGATE_ROW_NAME);
    if (aggregate) console.log(reportLine(aggregate, invocation.threshold));

    const fileMisses = rows.filter(
      (row) =>
        row.file !== AGGREGATE_ROW_NAME &&
        (row.functions < invocation.threshold.functions ||
          row.lines < invocation.threshold.lines),
    );
    fileMisses.forEach((row) =>
      console.log(reportLine(row, invocation.threshold)),
    );

    return fileMisses.length > 0 ? [invocation.label] : [];
  });

  if (misses.length === 0) {
    console.log("\nAll invocations meet their coverage threshold.");
    return 0;
  }
  console.log(
    `\n${misses.length} invocation(s) missed their coverage threshold: ${misses.join(", ")}`,
  );
  return 1;
}

process.exit(await main());
