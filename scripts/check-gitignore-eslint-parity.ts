import { readFileSync } from "node:fs";

const GITIGNORE_DIR_ENTRY = /^([^#\s][^\n]*)\/$/;
// Matches the first config object passed to tseslint.config(...) -- the
// project-wide ignores block -- not the per-rule `ignores` arrays used
// elsewhere in the file (e.g. the DAG-boundary test-file exclusions).
const GLOBAL_IGNORES_BLOCK =
  /tseslint\.config\(\s*\{\s*ignores:\s*\[([^\]]*)\]/;
const STRING_LITERAL = /"([^"]+)"/g;

function directoryEntries(gitignore: string): readonly string[] {
  return gitignore
    .split("\n")
    .map((line) => line.trim())
    .flatMap((line) => {
      const match = GITIGNORE_DIR_ENTRY.exec(line);
      return match ? [match[1]] : [];
    });
}

function eslintIgnoreGlobs(eslintConfig: string): readonly string[] {
  const match = GLOBAL_IGNORES_BLOCK.exec(eslintConfig);
  if (!match) return [];
  return [...match[1].matchAll(STRING_LITERAL)].map((m) => m[1]);
}

function hasMatchingIgnore(
  dirEntry: string,
  eslintGlobs: readonly string[],
): boolean {
  const dirName = dirEntry.split("/").filter(Boolean).at(-1) ?? dirEntry;
  return eslintGlobs.some((glob) =>
    glob.split("/").filter(Boolean).includes(dirName),
  );
}

const gitignore = readFileSync(".gitignore", "utf8");
const eslintConfig = readFileSync("eslint.config.ts", "utf8");
const eslintGlobs = eslintIgnoreGlobs(eslintConfig);
const unpaired = directoryEntries(gitignore).filter(
  (entry) => !hasMatchingIgnore(entry, eslintGlobs),
);

if (unpaired.length === 0) {
  console.log(
    "Every directory-shaped .gitignore entry has a matching eslint.config.ts ignore.",
  );
} else {
  console.log(
    `Found ${unpaired.length} directory-shaped .gitignore ${unpaired.length === 1 ? "entry" : "entries"} with no matching eslint.config.ts ignore:\n`,
  );
  for (const entry of unpaired) {
    console.log(`  ${entry}/`);
  }
  console.log(
    "\nAdd a corresponding pattern to eslint.config.ts's global ignores array (see storybook-static/ for precedent), or explain why the directory is safe to omit.",
  );
  process.exit(1);
}
