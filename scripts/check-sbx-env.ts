import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const FORBIDDEN_KEYS = [
  "secrets",
  "bindings",
  "registries",
  "additionalWorkspaces",
  "localWorkspaces",
] as const;

const REQUIRED_PORTS = [5173, 6006] as const;
const filesToCheck = [".sbx/sbxenv.yaml", ".sbx/sbxenv.agy.yaml", ".sbx/sbxenv.claude.yaml"] as const;
const kitSpecFile = ".sbx/kit/spec.yaml";
const kitDir = ".sbx/kit";

type MinimalKitSpec = {
  readonly name?: unknown;
  readonly schemaVersion?: unknown;
};

type MinimalSbxEnv = {
  readonly name?: unknown;
  readonly agent?: unknown;
  readonly workspace?: { readonly clone?: unknown };
  readonly kits?: readonly unknown[];
  readonly ports?: readonly { readonly sandbox?: unknown }[];
};

function checkKitWithSbx(dir: string): boolean {
  try {
    execSync("command -v sbx", { stdio: "ignore" });
  } catch {
    console.warn("sbx CLI not found; skipping native kit validation");
    return true;
  }

  try {
    console.log(`Running host 'sbx kit validate ${dir}'...`);
    execSync(`sbx kit validate ${dir}`, { stdio: "inherit" });
    return true;
  } catch (err) {
    console.error(`Host 'sbx kit validate ${dir}' failed:`, err);
    return false;
  }
}

function checkEnvWithSbx(file: string): boolean {
  try {
    execSync("command -v sbx", { stdio: "ignore" });
  } catch {
    return true;
  }

  try {
    console.log(`Running host 'sbx env plan ${file}'...`);
    execSync(`sbx env plan ${file}`, { stdio: "inherit" });
    return true;
  } catch (err) {
    console.error(`Host 'sbx env plan ${file}' failed:`, err);
    return false;
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

  const kit = parsed as MinimalKitSpec;
  if (typeof kit.name !== "string" || kit.name.length === 0) {
    console.error(`File ${file} is missing a valid name string`);
    return false;
  }
  if (kit.schemaVersion !== 2 && kit.schemaVersion !== "2") {
    console.error(`File ${file} must specify schemaVersion: 2`);
    return false;
  }

  console.log(
    `✓ ${file} is valid (${kit.name}, schemaVersion: ${kit.schemaVersion})`,
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

  const env = parsed as MinimalSbxEnv;
  if (env.workspace?.clone !== false) {
    console.error(`File ${file} must have workspace.clone: false`);
    return false;
  }

  if (!env.kits || !env.kits.includes("./kit")) {
    console.error(`File ${file} must include "./kit" in kits`);
    return false;
  }

  const declaredSandboxPorts = new Set(
    (env.ports ?? []).map((port) => port.sandbox),
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
    `✓ ${file} is valid (${String(env.name)}, agent: ${String(env.agent)})`,
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
const nativeKitPassed = checkKitWithSbx(kitDir);
const nativeEnvPassed = filesToCheck.every(checkEnvWithSbx);

if (
  !kitPassed ||
  !envPassed ||
  !parityPassed ||
  !nativeKitPassed ||
  !nativeEnvPassed
) {
  process.exit(1);
}
