import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(import.meta.dir, "../../..");

const collectTsFiles = (dir: string): readonly string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectTsFiles(full);
    if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      entry.name !== "AGENTS.md"
    )
      return [full];
    return [];
  });

const extractSourceExports = (pkgName: string): readonly string[] => {
  const srcDir = resolve(ROOT, `packages/${pkgName}/src`);
  const allNames = collectTsFiles(srcDir).flatMap((file) =>
    [
      ...readFileSync(file, "utf-8").matchAll(
        /^export (?:type |interface |class |enum |const |function )(\w+)/gm,
      ),
    ].map((m) => m[1]),
  );
  return [...new Set(allNames)].sort();
};

const parseAgentsMdExports = (pkgName: string): readonly string[] => {
  const agentsPath = resolve(ROOT, `packages/${pkgName}/src/AGENTS.md`);
  const content = readFileSync(agentsPath, "utf-8");
  const match = content.match(/```ts-exports\n([\s\S]*?)```/);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .sort();
};

const parseDagOrder = (): readonly string[] => {
  const configPath = resolve(ROOT, "eslint.config.ts");
  const content = readFileSync(configPath, "utf-8");
  const match = content.match(/const\s+DAG_ORDER\s*=\s*\[([\s\S]*?)\]\s*as\s+const/);
  if (!match) {
    throw new Error("Could not find DAG_ORDER in eslint.config.ts");
  }
  return match[1]
    .split(",")
    .map((s) => s.replace(/["']/g, "").trim())
    .filter(Boolean);
};

const parseImportRules = (
  pkgName: string,
): {
  readonly mayImport: readonly string[];
  readonly mustNotImport: readonly string[];
} => {
  const agentsPath = resolve(ROOT, `packages/${pkgName}/src/AGENTS.md`);
  const content = readFileSync(agentsPath, "utf-8");
  const lines = content.split("\n");
  const sectionIdx = lines.findIndex((l) => l.trim() === "## Import Rules");
  if (sectionIdx === -1) {
    throw new Error(`No "## Import Rules" section found in ${agentsPath}`);
  }

  const sectionLines = lines.slice(sectionIdx + 1);
  const nextSectionOffset = sectionLines.findIndex((l) => l.trim().startsWith("##"));
  const relevantLines = nextSectionOffset === -1 ? sectionLines : sectionLines.slice(0, nextSectionOffset);

  const mayLine = relevantLines.find((l) => l.trim().startsWith("- **May import from**:"));
  const mustNotLine = relevantLines.find((l) => l.trim().startsWith("- **Must not import from**:"));

  const mayImport = mayLine
    ? (() => {
        const parts = mayLine.replace("- **May import from**:", "").trim();
        return parts.toLowerCase().includes("nowhere")
          ? []
          : parts
              .split(",")
              .map((p) => p.replace(/[`/]/g, "").trim().split(/\s+/)[0])
              .filter(Boolean);
      })()
    : [];

  const mustNotImport = mustNotLine
    ? (() => {
        const parts = mustNotLine.replace("- **Must not import from**:", "").trim();
        return parts.toLowerCase().includes("any")
          ? ["any"]
          : parts
              .split(",")
              .map((p) => p.replace(/[`/]/g, "").trim().split(/\s+/)[0])
              .filter(Boolean);
      })()
    : [];

  return { mayImport, mustNotImport };
};

const PACKAGES = ["geometry", "catalog", "assembly", "packer", "store"] as const;

describe("D6 — Package Type Ownership Manifest", () => {
  PACKAGES.forEach((pkg) => {
    test(`${pkg}: AGENTS.md ts-exports matches source exports`, () => {
      const agentsList = parseAgentsMdExports(pkg);
      const sourceExports = extractSourceExports(pkg);
      expect(agentsList).toEqual([...sourceExports]);
    });
  });
});

describe("D6 — Package Import Rules Validation", () => {
  const dagOrder = parseDagOrder();

  PACKAGES.forEach((pkg) => {
    test(`${pkg}: AGENTS.md import rules match eslint.config.ts`, () => {
      const pkgIndex = dagOrder.indexOf(pkg);
      expect(pkgIndex).toBeGreaterThanOrEqual(0);

      const { mayImport, mustNotImport } = parseImportRules(pkg);

      const expectedMay = dagOrder.slice(0, pkgIndex);
      expect([...mayImport].sort()).toEqual([...expectedMay].sort());

      const expectedMustNot = dagOrder.slice(pkgIndex + 1);
      if (mustNotImport.length === 1 && mustNotImport[0] === "any") {
        expect(expectedMustNot.length).toBeGreaterThan(0);
      } else {
        expect([...mustNotImport].sort()).toEqual([...expectedMustNot].sort());
      }
    });
  });
});

describe("D7 — Cross-Layer Name Collision Guard", () => {
  test("no package exports the same non-Schema type name as another package", () => {
    const exportsByPkg = Object.fromEntries(
      PACKAGES.map((pkg) => [
        pkg,
        extractSourceExports(pkg).filter((n) => !n.endsWith("Schema")),
      ]),
    ) as Record<string, readonly string[]>;

    const { collisions } = PACKAGES.reduce(
      (
        acc: {
          readonly seen: ReadonlyMap<string, string>;
          readonly collisions: ReadonlyArray<{
            readonly name: string;
            readonly pkgs: readonly [string, string];
          }>;
        },
        pkg,
      ) => {
        const newCollisions = exportsByPkg[pkg]
          .filter((name) => acc.seen.has(name))
          .map((name) => ({
            name,
            pkgs: [acc.seen.get(name)!, pkg] as readonly [string, string],
          }));
        const newEntries = exportsByPkg[pkg]
          .filter((name) => !acc.seen.has(name))
          .map((name): readonly [string, string] => [name, pkg]);
        return {
          seen: new Map([...acc.seen, ...newEntries]),
          collisions: [...acc.collisions, ...newCollisions],
        };
      },
      { seen: new Map<string, string>(), collisions: [] },
    );

    expect(
      collisions,
      "cross-layer name collisions: each colliding type should be defined in exactly one package",
    ).toEqual([]);
  });
});
