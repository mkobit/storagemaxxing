import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
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

const sbxEnvSchema = z
  .object({
    schemaVersion: z.literal("1"),
    name: z.string().min(1),
    agent: z.enum(["codex", "agy"]),
    workspace: workspaceSchema,
    kits: z.array(z.string()).optional(),
  })
  .strict();

const filesToCheck = [".sbx/.sbxenv.yaml", ".sbx/.sbxenv.agy.yaml"] as const;

function checkFile(file: string): boolean {
  if (!existsSync(file)) {
    console.error(`Missing expected environment file: ${file}`);
    return false;
  }

  const raw = readFileSync(file, "utf8");
  let parsed: unknown;
  try {
    parsed = parse(raw);
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

  console.log(
    `✓ ${file} is valid (${result.data.name}, agent: ${result.data.agent})`,
  );
  return true;
}

const allPassed = filesToCheck.every(checkFile);
if (!allPassed) {
  process.exit(1);
}
