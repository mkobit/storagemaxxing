#!/usr/bin/env bun
// Shared stdin payload schema for Claude Code hook scripts in this directory.

import { z } from "zod";

const hookInputSchema = z.object({
  tool_input: z
    .object({
      file_path: z.string().optional(),
      command: z.string().optional(),
    })
    .optional(),
});

export type HookInput = z.infer<typeof hookInputSchema>;

export async function readHookInput(): Promise<HookInput> {
  const raw = await Bun.stdin.json().catch(() => undefined);
  const result = hookInputSchema.safeParse(raw);
  if (!result.success) {
    process.exit(0);
  }
  return result.data;
}
