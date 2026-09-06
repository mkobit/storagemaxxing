import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { kitSpecSchema, sbxEnvV1Schema } from "./sbx-schemas";

const FORBIDDEN_KEYS = [
  "secrets",
  "bindings",
  "registries",
  "additionalWorkspaces",
  "localWorkspaces",
] as const;

const REQUIRED_PORTS = [5173, 6006] as const;
const filesToCheck = [".sbx/.sbxenv.yaml", ".sbx/.sbxenv.agy.yaml"] as const;
const kitSpecFile = ".sbx/kit/spec.yaml";
const kitDir = ".sbx/kit";

function checkKitWithSbxIfAvailable(dir: string): void {
  try {
    execSync("command -v sbx", { stdio: "ignore" });
    console.log(`Running host 'sbx kit validate ${dir}'...`);
    execSync(`sbx kit validate ${dir}`, { stdio: "inherit" });
  } catch {
    // sbx CLI is optional in CI or headless environments
  }
}

function checkKitSpec(file: string): boolean {
  if (!existsSync(file)) {
    console.error(`Missing expected kit spec file: ${file}`);
    return false;
  }

  const raw = readFileSync(file, "utf8");
  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(raw);
  } catch (err) {
    console.error(`Failed to parse YAML in ${file}:`, err);
    return false;
  }

  if (typeof parsed !== "object" || parsed === null) {
    console.error(`File ${file} does not contain a YAML object`);
    return false;
  }

  const result = kitSpecSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`Validation failed for ${file}:`, result.error.format());
    return false;
  }

  console.log(
    `✓ ${file} is valid (${result.data.name}, schemaVersion: ${result.data.schemaVersion})`,
  );
  return true;
}

function checkFile(file: string): boolean {
  if (!existsSync(file)) {
    console.error(`Missing expected environment file: ${file}`);
    return false;
  }

  const raw = readFileSync(file, "utf8");
  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(raw);
  } catch (err) {
    console.error(`Failed to parse YAML in ${file}:`, err);
    return false;
  }

  if (typeof parsed !== "object" || parsed === null) {
    console.error(`File ${file} does not contain a YAML object`);
    return false;
  }

  const record = parsed as Record<string, unknown>;
  const foundForbidden = FORBIDDEN_KEYS.filter((key) => key in record);
  if (foundForbidden.length > 0) {
    console.error(
      `File ${file} contains forbidden tracked properties: ${foundForbidden.join(", ")}`,
    );
    return false;
  }

  const result = sbxEnvV1Schema.safeParse(parsed);
  if (!result.success) {
    console.error(`Validation failed for ${file}:`, result.error.format());
    return false;
  }

  if (!result.data.workspace.clone) {
    console.error(`File ${file} must have workspace.clone: true`);
    return false;
  }

  if (!result.data.kits || !result.data.kits.includes("./kit")) {
    console.error(`File ${file} must include "./kit" in kits`);
    return false;
  }

  const declaredSandboxPorts = new Set(
    (result.data.ports ?? []).map((port) => port.sandbox),
  );
  for (const requiredPort of REQUIRED_PORTS) {
    if (!declaredSandboxPorts.has(requiredPort)) {
      console.error(
        `File ${file} must forward required sandbox port ${requiredPort}`,
      );
      return false;
    }
  }

  console.log(
    `✓ ${file} is valid (${result.data.name}, agent: ${result.data.agent})`,
  );
  return true;
}

function checkToolchainParity(): boolean {
  const miseFile = "mise.toml";
  const pkgFile = "package.json";

  if (
    !existsSync(miseFile) ||
    !existsSync(pkgFile) ||
    !existsSync(kitSpecFile)
  ) {
    console.error("Missing required config files for toolchain parity check");
    return false;
  }

  let mise: { tools?: Record<string, string> };
  try {
    mise = Bun.TOML.parse(readFileSync(miseFile, "utf8")) as {
      tools?: Record<string, string>;
    };
  } catch (err) {
    console.error(`Failed to parse ${miseFile}:`, err);
    return false;
  }

  let pkg: {
    packageManager?: string;
    engines?: { bun?: string };
  };
  try {
    pkg = JSON.parse(readFileSync(pkgFile, "utf8")) as {
      packageManager?: string;
      engines?: { bun?: string };
    };
  } catch (err) {
    console.error(`Failed to parse ${pkgFile}:`, err);
    return false;
  }

  const rawKit = readFileSync(kitSpecFile, "utf8");
  let parsedKit: unknown;
  try {
    parsedKit = Bun.YAML.parse(rawKit);
  } catch (err) {
    console.error(`Failed to parse ${kitSpecFile}:`, err);
    return false;
  }

  const kitObj = parsedKit as {
    setup?: { install?: Array<{ command?: string }> };
  };

  const miseBun = mise.tools?.["bun"];
  const miseBeads = mise.tools?.["github:gastownhall/beads"];

  if (!miseBun) {
    console.error(`${miseFile} missing tools.bun definition`);
    return false;
  }

  // Check package.json packageManager
  const pkgManagerBun = pkg.packageManager?.replace(/^bun@/, "");
  if (pkgManagerBun !== miseBun) {
    console.error(
      `Version mismatch: ${pkgFile} packageManager (${pkg.packageManager}) does not match ${miseFile} bun (${miseBun})`,
    );
    return false;
  }

  // Check package.json engines.bun
  if (pkg.engines?.bun !== miseBun) {
    console.error(
      `Version mismatch: ${pkgFile} engines.bun (${pkg.engines?.bun}) does not match ${miseFile} bun (${miseBun})`,
    );
    return false;
  }

  // Check .sbx/kit/spec.yaml install commands
  const installCommands = (kitObj.setup?.install ?? [])
    .map((step) => step.command ?? "")
    .join("\n");

  const kitBunMatch = installCommands.match(/bun@([0-9]+\.[0-9]+\.[0-9]+)/);
  if (!kitBunMatch) {
    console.error(
      `${kitSpecFile} does not declare an explicit bun version (expected bun@<semver>)`,
    );
    return false;
  }

  if (kitBunMatch[1] !== miseBun) {
    console.error(
      `Version mismatch: ${kitSpecFile} declares bun@${kitBunMatch[1]}, but ${miseFile} declares ${miseBun}`,
    );
    return false;
  }

  if (miseBeads) {
    const kitBeadsMatch = installCommands.match(
      /(?:github:gastownhall\/beads|beads)@([0-9]+\.[0-9]+\.[0-9]+)/,
    );
    if (!kitBeadsMatch) {
      console.error(
        `${kitSpecFile} does not declare an explicit beads version (expected beads@<semver>)`,
      );
      return false;
    }
    if (kitBeadsMatch[1] !== miseBeads) {
      console.error(
        `Version mismatch: ${kitSpecFile} declares beads@${kitBeadsMatch[1]}, but ${miseFile} declares ${miseBeads}`,
      );
      return false;
    }
  }

  console.log(
    `✓ Toolchain parity verified: bun@${miseBun}, beads@${miseBeads}`,
  );
  return true;
}

const kitPassed = checkKitSpec(kitSpecFile);
const envPassed = filesToCheck.every(checkFile);
const parityPassed = checkToolchainParity();

if (!kitPassed || !envPassed || !parityPassed) {
  process.exit(1);
}

// When running in an environment where sbx CLI is installed, also run native sbx kit validate
checkKitWithSbxIfAvailable(kitDir);
