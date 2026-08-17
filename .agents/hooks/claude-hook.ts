#!/usr/bin/env bun
// Shared stdin payload schema for Claude Code and Antigravity (AGY) hook scripts in this directory.

import { z } from "zod";

const hookInputSchema = z.object({
  tool_input: z
    .object({
      command: z.string().optional(),
      file_path: z.string().optional(),
    })
    .optional(),
  toolCall: z
    .object({
      args: z
        .object({
          AbsolutePath: z.string().optional(),
          CommandLine: z.string().optional(),
          TargetFile: z.string().optional(),
          command: z.string().optional(),
          file_path: z.string().optional(),
        })
        .optional(),
      name: z.string().optional(),
    })
    .optional(),
  workspacePaths: z.array(z.string()).optional(),
});

type ParsedPayload = z.infer<typeof hookInputSchema>;

export type HookInput = {
  readonly tool_input?: {
    readonly command?: string;
    readonly file_path?: string;
  };
  readonly workspaceRoot?: string;
};

function extractFilePath(data: ParsedPayload): string | undefined {
  const directPath = data.tool_input?.file_path;
  if (directPath) return directPath;
  const args = data.toolCall?.args;
  if (!args) return undefined;
  return args.TargetFile || args.AbsolutePath || args.file_path;
}

function extractCommand(data: ParsedPayload): string | undefined {
  const directCmd = data.tool_input?.command;
  if (directCmd) return directCmd;
  const args = data.toolCall?.args;
  if (!args) return undefined;
  return args.CommandLine || args.command;
}

function extractWorkspaceRoot(data: ParsedPayload): string | undefined {
  const firstPath = data.workspacePaths?.[0];
  if (firstPath) return firstPath;
  return process.env.CLAUDE_PROJECT_DIR;
}

export async function readHookInput(): Promise<HookInput> {
  const raw: unknown = await Bun.stdin.json().catch(() => undefined);
  const result = hookInputSchema.safeParse(raw);
  if (!result.success) {
    process.exit(0);
  }

  return {
    tool_input: {
      command: extractCommand(result.data),
      file_path: extractFilePath(result.data),
    },
    workspaceRoot: extractWorkspaceRoot(result.data),
  };
}
