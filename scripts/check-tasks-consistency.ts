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

type CheckboxRef = {
  readonly line: number;
  readonly beadId: string;
  readonly checked: boolean;
};

function findTasksFiles(dir: string): readonly string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) return findTasksFiles(full);
    return entry === "tasks.md" ? [full] : [];
  });
}

function extractCheckboxRefs(file: string): readonly CheckboxRef[] {
  const lines = readFileSync(file, "utf8").split("\n");
  const found: CheckboxRef[] = [];
  for (const [index, line] of lines.entries()) {
    const checkboxMatch = CHECKBOX_LINE.exec(line);
    if (!checkboxMatch) continue;
    const idMatch = BEAD_ID.exec(checkboxMatch[4]);
    if (!idMatch) continue;
    found.push({
      line: index + 1,
      beadId: idMatch[0],
      checked: checkboxMatch[2].toLowerCase() === "x",
    });
  }
  return found;
}

// Fetches every bead's status in a single `bd show` invocation instead of one
// subprocess per unique ID -- with ~40+ beads referenced repo-wide across
// openspec/changes/**/tasks.md, per-ID subprocess overhead compounds linearly
// and previously caused this script to exceed the 120s default tool timeout.
async function fetchBeadStatuses(
  ids: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const statuses = new Map<string, string>();
  if (ids.length === 0) return statuses;
  const proc = Bun.spawn(["bd", "show", ...ids, "--json"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  const parsed: unknown = JSON.parse(out);
  // bd show --json returns an array for any valid IDs found, but a bare
  // error object ({ error, schema_version }) when NONE of the requested IDs
  // resolve -- normalize both shapes into an array to scan uniformly.
  const records = Array.isArray(parsed) ? parsed : [parsed];
  for (const record of records) {
    if (typeof record !== "object" || record === null) continue;
    if (!("id" in record) || !("status" in record)) continue;
    const { id, status } = record as {
      readonly id: unknown;
      readonly status: unknown;
    };
    if (typeof id === "string" && typeof status === "string") {
      statuses.set(id, status);
    }
  }
  return statuses;
}

function mismatchesInFile(
  file: string,
  refs: readonly CheckboxRef[],
  statuses: ReadonlyMap<string, string>,
): readonly Mismatch[] {
  const found: Mismatch[] = [];
  for (const ref of refs) {
    const status = statuses.get(ref.beadId);
    if (status === undefined) continue;
    if ((status === "closed") !== ref.checked) {
      found.push({
        file,
        line: ref.line,
        beadId: ref.beadId,
        checked: ref.checked,
        beadStatus: status,
      });
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

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const root = args.find((arg) => !arg.startsWith("--")) ?? "openspec/changes";
const files = findTasksFiles(root);
const refsByFile = new Map(
  files.map((file) => [file, extractCheckboxRefs(file)]),
);
const allIds = [
  ...new Set([...refsByFile.values()].flat().map((r) => r.beadId)),
];
const statuses = await fetchBeadStatuses(allIds);

const mismatches = files.flatMap((file) =>
  mismatchesInFile(file, refsByFile.get(file) ?? [], statuses),
);

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
    console.log(
      `  ${m.file}:${m.line} — ${m.beadId} is ${m.beadStatus} but checkbox is ${box}`,
    );
  }
  process.exit(1);
}
