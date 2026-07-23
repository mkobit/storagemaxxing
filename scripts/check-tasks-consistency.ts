import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BEAD_ID = /\bsm-[a-z0-9]+(?:\.\d+)?\b/i;
const CHECKBOX_LINE = /^(\s*-\s\[)( |x)(\]\s+)(.*)$/i;

type Mismatch = {
  readonly file: string;
  readonly line: number;
  readonly beadId: string;
  readonly checked: boolean;
  readonly beadStatus: string;
};

function findTasksFiles(dir: string): readonly string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) return findTasksFiles(full);
    return entry === "tasks.md" ? [full] : [];
  });
}

async function beadStatus(id: string): Promise<string | undefined> {
  const proc = Bun.spawn(["bd", "show", id, "--json"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) return undefined;
  const parsed: unknown = JSON.parse(out);
  const record = Array.isArray(parsed) ? parsed[0] : parsed;
  if (typeof record !== "object" || record === null || !("status" in record)) {
    return undefined;
  }
  const { status } = record as { readonly status: unknown };
  return typeof status === "string" ? status : undefined;
}

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const root = args.find((arg) => !arg.startsWith("--")) ?? "openspec/changes";
const files = findTasksFiles(root);
const statusCache = new Map<string, string | undefined>();

async function statusFor(beadId: string): Promise<string | undefined> {
  if (!statusCache.has(beadId)) {
    statusCache.set(beadId, await beadStatus(beadId));
  }
  return statusCache.get(beadId);
}

async function mismatchesInFile(file: string): Promise<readonly Mismatch[]> {
  const lines = readFileSync(file, "utf8").split("\n");
  const found: Mismatch[] = [];
  for (const [index, line] of lines.entries()) {
    const checkboxMatch = CHECKBOX_LINE.exec(line);
    if (!checkboxMatch) continue;
    const idMatch = BEAD_ID.exec(checkboxMatch[4]);
    if (!idMatch) continue;
    const beadId = idMatch[0];
    const status = await statusFor(beadId);
    if (status === undefined) continue;
    const checked = checkboxMatch[2].toLowerCase() === "x";
    if ((status === "closed") !== checked) {
      found.push({ file, line: index + 1, beadId, checked, beadStatus: status });
    }
  }
  return found;
}

function applyFixes(file: string, fileMismatches: readonly Mismatch[]): void {
  const lines = readFileSync(file, "utf8").split("\n");
  const mismatchByLine = new Map(fileMismatches.map((m) => [m.line, m]));
  const fixedLines = lines.map((line, index) => {
    const mismatch = mismatchByLine.get(index + 1);
    if (!mismatch) return line;
    const checkboxMatch = CHECKBOX_LINE.exec(line);
    if (!checkboxMatch) return line;
    const mark = mismatch.beadStatus === "closed" ? "x" : " ";
    return `${checkboxMatch[1]}${mark}${checkboxMatch[3]}${checkboxMatch[4]}`;
  });
  writeFileSync(file, fixedLines.join("\n"));
}

const results = await Promise.all(files.map(mismatchesInFile));
const mismatches = results.flat();

if (mismatches.length === 0) {
  console.log("No bd-close / tasks.md checkbox mismatches found.");
} else if (fix) {
  const mismatchesByFile = new Map<string, Mismatch[]>();
  for (const m of mismatches) {
    mismatchesByFile.set(m.file, [...(mismatchesByFile.get(m.file) ?? []), m]);
  }
  for (const [file, fileMismatches] of mismatchesByFile) {
    applyFixes(file, fileMismatches);
    console.log(`Fixed ${fileMismatches.length} checkbox(es) in ${file}`);
  }
} else {
  console.log(`Found ${mismatches.length} mismatch(es):\n`);
  for (const m of mismatches) {
    const box = m.checked ? "[x]" : "[ ]";
    console.log(`  ${m.file}:${m.line} — ${m.beadId} is ${m.beadStatus} but checkbox is ${box}`);
  }
  process.exit(1);
}
