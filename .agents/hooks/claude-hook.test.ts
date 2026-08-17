import { describe, expect, test } from "bun:test";

const HOOK_HELPER_TEST_SCRIPT = `
import { readHookInput } from "./claude-hook";
const input = await readHookInput();
process.stdout.write(JSON.stringify(input));
`;

async function runHelperWithStdin(payload: unknown): Promise<{
  readonly tool_input?: {
    readonly command?: string;
    readonly file_path?: string;
  };
  readonly workspaceRoot?: string;
}> {
  const proc = Bun.spawn(["bun", "-e", HOOK_HELPER_TEST_SCRIPT], {
    cwd: import.meta.dir,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();

  const stdout = await new Response(proc.stdout).text();
  await proc.exited;
  return JSON.parse(stdout) as {
    readonly tool_input?: {
      readonly command?: string;
      readonly file_path?: string;
    };
    readonly workspaceRoot?: string;
  };
}

describe("readHookInput", () => {
  test("parses Claude Code tool_input payload", async () => {
    const res = await runHelperWithStdin({
      tool_input: {
        command: "git commit -m 'test'",
        file_path: "apps/web/src/index.ts",
      },
    });

    expect(res.tool_input?.file_path).toBe("apps/web/src/index.ts");
    expect(res.tool_input?.command).toBe("git commit -m 'test'");
  });

  test("parses AGY toolCall and workspacePaths payload", async () => {
    const res = await runHelperWithStdin({
      toolCall: {
        args: {
          CommandLine: "git commit -m 'agy test'",
          TargetFile: "/path/to/workspace/apps/web/src/index.ts",
        },
        name: "replace_file_content",
      },
      workspacePaths: ["/path/to/workspace"],
    });

    expect(res.tool_input?.file_path).toBe(
      "/path/to/workspace/apps/web/src/index.ts",
    );
    expect(res.tool_input?.command).toBe("git commit -m 'agy test'");
    expect(res.workspaceRoot).toBe("/path/to/workspace");
  });
});
