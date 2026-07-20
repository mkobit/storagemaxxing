import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BEAD_ID = /\bsm-[a-z0-9]+(?:\.\d+)?\b/i;
const CHECKBOX_LINE = /^\s*-\s\[( |x)\]\s+(.*)$/i;

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
  if (typeof parsed !== "object" || parsed === null || !("status" in parsed)) {
    return undefined;
  }
  const { status } = parsed as { readonly status: unknown };
  return typeof status === "string" ? status : undefined;
}

const root = process.argv[2] ?? "openspec/changes";
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
    const idMatch = BEAD_ID.exec(checkboxMatch[2]);
    if (!idMatch) continue;
    const beadId = idMatch[0];
    const status = await statusFor(beadId);
    if (status === undefined) continue;
    const checked = checkboxMatch[1].toLowerCase() === "x";
    if ((status === "closed") !== checked) {
      found.push({ file, line: index + 1, beadId, checked, beadStatus: status });
    }
  }
  return found;
}

const results = await Promise.all(files.map(mismatchesInFile));
const mismatches = results.flat();

if (mismatches.length === 0) {
  console.log("No bd-close / tasks.md checkbox mismatches found.");
} else {
  console.log(`Found ${mismatches.length} mismatch(es):\n`);
  for (const m of mismatches) {
    const box = m.checked ? "[x]" : "[ ]";
    console.log(`  ${m.file}:${m.line} — ${m.beadId} is ${m.beadStatus} but checkbox is ${box}`);
  }
  process.exit(1);
}
