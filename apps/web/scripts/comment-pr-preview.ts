export const COMMENT_MARKER = "<!-- cloudflare-preview-deployment -->";

export interface DeployOutputEntry {
  readonly type?: string;
  readonly targets?: readonly string[];
  readonly url?: string;
  readonly worker_name?: string;
}

export function extractPreviewUrl(
  outputContent: string,
  prNumber: number,
): string {
  const lines = outputContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as DeployOutputEntry;
      if (parsed.type === "deploy" && Array.isArray(parsed.targets)) {
        const found = parsed.targets.find(
          (t): t is string =>
            typeof t === "string" &&
            (t.includes("workers.dev") || t.startsWith("http")),
        );
        if (found !== undefined) {
          return found.startsWith("http") ? found : `https://${found}`;
        }
      }
      if (typeof parsed.url === "string" && parsed.url.length > 0) {
        return parsed.url.startsWith("http")
          ? parsed.url
          : `https://${parsed.url}`;
      }
    } catch {
      // Ignore non-JSON lines
    }
  }

  const match = outputContent.match(/https:\/\/[a-zA-Z0-9.-]+\.workers\.dev/);
  if (match !== null) {
    return match[0];
  }

  return `https://storagemaxxing-web-pr-${prNumber}.mkobit-cloudflare.workers.dev`;
}

export function formatCommentBody(
  previewUrl: string,
  commitSha?: string,
): string {
  const shortSha =
    commitSha !== undefined && commitSha.length > 0
      ? `\`${commitSha.slice(0, 7)}\``
      : "N/A";
  return [
    COMMENT_MARKER,
    "### 🚀 Cloudflare Workers Preview",
    "",
    "| Environment | Preview URL | Commit |",
    "| :--- | :--- | :--- |",
    `| Preview | [${previewUrl}](${previewUrl}) | ${shortSha} |`,
    "",
    "*Deployed to Cloudflare Workers with static assets.*",
  ].join("\n");
}

export function formatTeardownCommentBody(prNumber: number): string {
  return [
    COMMENT_MARKER,
    "### 🛑 Cloudflare Workers Preview (Closed)",
    "",
    `Preview deployment \`storagemaxxing-web-pr-${prNumber}\` has been torn down.`,
  ].join("\n");
}

export async function verifyUrlStatus(
  url: string,
  maxAttempts = 30,
  delayMs = 2000,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  console.log(`Verifying preview deployment reachable at ${url}...`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchFn(url, {
        method: "GET",
        headers: { "User-Agent": "storagemaxxing-preview-check" },
      });
      if (res.status === 200) {
        console.log(`Preview URL returned HTTP 200 on attempt ${attempt}.`);
        return;
      }
      console.log(
        `Attempt ${attempt}/${maxAttempts}: HTTP ${res.status}. Retrying in ${delayMs / 1000}s...`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(
        `Attempt ${attempt}/${maxAttempts}: Network error (${msg}). Retrying in ${delayMs / 1000}s...`,
      );
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(
    `Preview URL ${url} did not return HTTP 200 after ${maxAttempts} attempts.`,
  );
}

export interface CommentOptions {
  readonly repo: string;
  readonly prNumber: number;
  readonly token: string;
  readonly body: string;
  readonly fetchFn?: typeof fetch;
}

export async function postOrUpdateComment(
  options: CommentOptions,
): Promise<void> {
  const { repo, prNumber, token, body, fetchFn = fetch } = options;
  const baseUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "storagemaxxing-preview-deploy",
  };

  const listRes = await fetchFn(baseUrl, { headers });
  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(
      `Failed to list PR comments (${listRes.status}): ${errorText}`,
    );
  }

  const comments = (await listRes.json()) as readonly {
    readonly id: number;
    readonly body?: string;
  }[];
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));

  if (existing !== undefined) {
    console.log(`Updating existing preview comment (ID: ${existing.id})...`);
    const updateRes = await fetchFn(
      `https://api.github.com/repos/${repo}/issues/comments/${existing.id}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      },
    );
    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(
        `Failed to update comment (${updateRes.status}): ${errorText}`,
      );
    }
  } else {
    console.log(`Creating new preview comment on PR #${prNumber}...`);
    const createRes = await fetchFn(baseUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    });
    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(
        `Failed to create comment (${createRes.status}): ${errorText}`,
      );
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const arg = args.find((a) => a.startsWith(prefix));
    if (arg !== undefined) {
      return arg.slice(prefix.length);
    }
    const idx = args.indexOf(`--${name}`);
    if (idx !== -1 && idx + 1 < args.length) {
      return args[idx + 1];
    }
    return undefined;
  };

  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const prStr = getArg("pr") ?? process.env.PR_NUMBER;
  if (prStr === undefined) {
    console.error(
      "Missing required --pr argument or PR_NUMBER environment variable.",
    );
    process.exit(1);
  }
  const prNumber = parseInt(prStr, 10);
  if (Number.isNaN(prNumber)) {
    console.error(`Invalid PR number: "${prStr}".`);
    process.exit(1);
  }

  const repo = getArg("repo") ?? process.env.GITHUB_REPOSITORY;
  const commit = getArg("commit") ?? process.env.GITHUB_SHA;
  const outputFile = getArg("output-file");
  const previewUrlOverride = getArg("preview-url");
  const isTeardown = hasFlag("teardown");
  const isDryRun = hasFlag("dry-run");
  const skipVerify = hasFlag("skip-verify");

  if (isTeardown) {
    const body = formatTeardownCommentBody(prNumber);
    if (isDryRun || repo === undefined) {
      console.log("Dry run / no repo, teardown comment body:\n", body);
      return;
    }
    const token = process.env.GITHUB_TOKEN;
    if (token === undefined) {
      console.warn("GITHUB_TOKEN not set, skipping teardown comment update.");
      return;
    }
    await postOrUpdateComment({ repo, prNumber, token, body });
    return;
  }

  let outputContent = "";
  if (outputFile !== undefined) {
    try {
      const { readFileSync } = await import("node:fs");
      outputContent = readFileSync(outputFile, "utf-8");
    } catch (err) {
      console.warn(
        `Could not read output file ${outputFile}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const previewUrl =
    previewUrlOverride ?? extractPreviewUrl(outputContent, prNumber);
  console.log(`Resolved preview URL: ${previewUrl}`);

  if (!skipVerify) {
    await verifyUrlStatus(previewUrl);
  }

  const body = formatCommentBody(previewUrl, commit);
  if (isDryRun || repo === undefined) {
    console.log("Dry run / no repo, comment body:\n", body);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (token === undefined) {
    console.warn("GITHUB_TOKEN not set, skipping PR comment posting.");
    return;
  }

  await postOrUpdateComment({ repo, prNumber, token, body });
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
