// Advisory-only coverage gate (openspec/changes/ci-quality-gates/design.md
// Decision 2/4): runs each invocation's own `bun test --coverage` and
// compares the aggregate "All files" row against a threshold, independently
// of the existing blocking `test` job. Does NOT set bunfig.toml's
// coverageThreshold -- that would fail `bun test --coverage` on a coverage
// miss using the same exit code as a real test failure, conflating the two.
// This script's own exit code is meant to be wrapped in `continue-on-error:
// true` at the CI-step level during the advisory period (sm-jb1j flips it).

export {};

type CoverageThreshold = {
  readonly line: number;
  readonly function: number;
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
    threshold: { line: 0.9, function: 0.85 },
  },
  {
    label: "apps/web",
    command: ["bun", "--cwd", "apps/web", "test", "src", "--coverage"],
    threshold: { line: 0.85, function: 0.8 },
  },
];

const ALL_FILES_ROW = /^All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/m;

type Measured = {
  readonly function: number;
  readonly line: number;
};

function parseCoverage(output: string): Measured | undefined {
  const match = ALL_FILES_ROW.exec(output);
  if (!match) return undefined;
  return { function: Number(match[1]) / 100, line: Number(match[2]) / 100 };
}

async function runInvocation(invocation: Invocation): Promise<{
  readonly measured: Measured | undefined;
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
  return { measured: parseCoverage(stdout + stderr), exitCode };
}

function reportLine(
  metric: "function" | "line",
  measured: number,
  threshold: number,
): string {
  const pct = (n: number): string => `${(n * 100).toFixed(2)}%`;
  const status = measured >= threshold ? "OK" : "MISS";
  return `    ${metric.padEnd(8)} ${pct(measured)} (threshold ${pct(threshold)}) ${status}`;
}

async function main(): Promise<number> {
  const results = await Promise.all(
    INVOCATIONS.map(async (invocation) => ({
      invocation,
      ...(await runInvocation(invocation)),
    })),
  );

  const misses = results.flatMap(({ invocation, measured, exitCode }) => {
    console.log(`${invocation.label} (exit ${exitCode}):`);
    if (!measured) {
      console.log("    could not parse coverage output -- treating as a miss");
      return [invocation.label];
    }
    console.log(
      reportLine("function", measured.function, invocation.threshold.function),
    );
    console.log(reportLine("line", measured.line, invocation.threshold.line));
    const missed =
      measured.function < invocation.threshold.function ||
      measured.line < invocation.threshold.line;
    return missed ? [invocation.label] : [];
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
