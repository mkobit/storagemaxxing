import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";

const workspaceSchema = z.object({
  path: z.string(),
  clone: z.boolean(),
});

const FORBIDDEN_KEYS = [
  "secrets",
  "bindings",
  "registries",
  "additionalWorkspaces",
  "localWorkspaces",
] as const;

const portSchema = z.object({
  sandbox: z.number().int().min(1).max(65535),
  host: z.number().int().min(1).max(65535).optional(),
  protocol: z.enum(["tcp", "tcp4", "tcp6", "udp", "udp4", "udp6"]).optional(),
  hostIP: z.string().optional(),
});

const sbxEnvSchema = z
  .object({
    schemaVersion: z.literal("1"),
    name: z.string().min(1),
    agent: z.enum(["codex", "agy"]),
    workspace: workspaceSchema,
    kits: z.array(z.string()).min(1),
    ports: z.array(portSchema).min(1),
  })
  .strict();

const kitSpecSchema = z
  .object({
    schemaVersion: z.literal("2"),
    kind: z.literal("mixin"),
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().optional(),
    permissions: z
      .object({
        network: z
          .object({
            allow: z.array(z.string()).min(1),
            deny: z.array(z.string()).optional(),
          })
          .optional(),
      })
      .optional(),
    environment: z
      .object({
        variables: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
    setup: z
      .object({
        files: z
          .array(
            z.object({
              path: z.string(),
              content: z.string(),
              mode: z.string().optional(),
              onlyIfMissing: z.boolean().optional(),
              description: z.string().optional(),
            }),
          )
          .optional(),
        install: z
          .array(
            z.object({
              command: z.string(),
              user: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .optional(),
        startup: z
          .array(
            z.object({
              command: z.union([z.string(), z.array(z.string())]),
              background: z.boolean().optional(),
              user: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),
  })
  .passthrough();

const REQUIRED_PORTS = [5173, 6006] as const;
const filesToCheck = [".sbx/.sbxenv.yaml", ".sbx/.sbxenv.agy.yaml"] as const;
const kitSpecFile = ".sbx/kit/spec.yaml";

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
    `✓ ${file} is valid (${result.data.name} v${result.data.version}, kind: ${result.data.kind})`,
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

  const result = sbxEnvSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`Validation failed for ${file}:`, result.error.format());
    return false;
  }

  if (!result.data.workspace.clone) {
    console.error(`File ${file} must have workspace.clone: true`);
    return false;
  }

  if (!result.data.kits.includes("./kit")) {
    console.error(`File ${file} must include "./kit" in kits`);
    return false;
  }

  const declaredSandboxPorts = new Set(
    result.data.ports.map((port) => port.sandbox),
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

const kitPassed = checkKitSpec(kitSpecFile);
const envPassed = filesToCheck.every(checkFile);

if (!kitPassed || !envPassed) {
  process.exit(1);
}
