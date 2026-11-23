export const PREVIEW_WORKER_PREFIX = "storagemaxxing-web-pr-";
export const DEFAULT_TTL_DAYS = 7;

const PREVIEW_WORKER_PATTERN = /^storagemaxxing-web-pr-(\d+)$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CloudflareWorkerScript {
  readonly id: string;
  readonly modified_on?: string;
  readonly created_on?: string;
}

export interface PullRequestInfo {
  readonly number: number;
  readonly state: "open" | "closed";
  readonly updated_at: string;
}

export interface SweepTarget {
  readonly workerName: string;
  readonly prNumber: number;
  readonly modifiedOn?: string;
}

export interface PruneDecision {
  readonly shouldPrune: boolean;
  readonly reason: string;
}

export interface SweepOptions {
  readonly accountId: string;
  readonly cloudflareToken: string;
  readonly githubToken: string;
  readonly repo: string;
  readonly ttlDays?: number;
  readonly dryRun?: boolean;
  readonly nowMs?: number;
  readonly fetchFn?: typeof fetch;
  readonly log?: (message: string) => void;
  readonly errorLog?: (message: string) => void;
}

export interface SweepResult {
  readonly totalWorkers: number;
  readonly previewWorkers: number;
  readonly pruned: readonly string[];
  readonly kept: readonly string[];
  readonly failed: readonly string[];
}

export function parsePreviewWorkerName(workerName: string): number | null {
  const match = PREVIEW_WORKER_PATTERN.exec(workerName);
  if (match === null) {
    return null;
  }
  const prNumber = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(prNumber) && prNumber > 0 ? prNumber : null;
}

export function evaluateWorkerPrune(
  target: SweepTarget,
  pr: PullRequestInfo | null,
  ttlDays: number,
  nowMs: number,
): PruneDecision {
  if (pr === null) {
    return {
      shouldPrune: true,
      reason: `PR #${target.prNumber} not found (404)`,
    };
  }

  if (pr.state === "closed") {
    return {
      shouldPrune: true,
      reason: `PR #${target.prNumber} is closed`,
    };
  }

  const lastUpdateIso = pr.updated_at || target.modifiedOn;
  if (lastUpdateIso === undefined) {
    return {
      shouldPrune: false,
      reason: `PR #${target.prNumber} is open (no update timestamp available)`,
    };
  }

  const lastUpdateMs = Date.parse(lastUpdateIso);
  if (Number.isNaN(lastUpdateMs)) {
    return {
      shouldPrune: false,
      reason: `PR #${target.prNumber} is open (unparseable timestamp "${lastUpdateIso}")`,
    };
  }

  const ageMs = nowMs - lastUpdateMs;
  const ttlMs = ttlDays * MS_PER_DAY;
  const ageDays = (ageMs / MS_PER_DAY).toFixed(1);

  if (ageMs > ttlMs) {
    return {
      shouldPrune: true,
      reason: `PR #${target.prNumber} inactive for ${ageDays}d (exceeds ${ttlDays}d TTL)`,
    };
  }

  return {
    shouldPrune: false,
    reason: `PR #${target.prNumber} is open (updated ${ageDays}d ago, within ${ttlDays}d TTL)`,
  };
}

export async function listCloudflareWorkers(
  accountId: string,
  cloudflareToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<readonly CloudflareWorkerScript[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`;
  const res = await fetchFn(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cloudflareToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to list Cloudflare Workers (${res.status}): ${errorText}`,
    );
  }

  const payload = (await res.json()) as {
    readonly success?: boolean;
    readonly result?: readonly CloudflareWorkerScript[];
  };

  if (payload.success === false || !Array.isArray(payload.result)) {
    throw new Error("Unexpected Cloudflare Workers list response payload.");
  }

  return payload.result;
}

export async function fetchPullRequest(
  repo: string,
  prNumber: number,
  githubToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<PullRequestInfo | null> {
  const url = `https://api.github.com/repos/${repo}/pulls/${prNumber}`;
  const res = await fetchFn(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "storagemaxxing-preview-sweep",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch PR #${prNumber} (${res.status}): ${errorText}`,
    );
  }

  const data = (await res.json()) as {
    readonly number: number;
    readonly state: "open" | "closed";
    readonly updated_at: string;
  };
  return {
    number: data.number,
    state: data.state,
    updated_at: data.updated_at,
  };
}

export async function deleteCloudflareWorker(
  accountId: string,
  workerName: string,
  cloudflareToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}?force=true`;
  const res = await fetchFn(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${cloudflareToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok && res.status !== 404) {
    const errorText = await res.text();
    throw new Error(
      `Failed to delete Cloudflare Worker "${workerName}" (${res.status}): ${errorText}`,
    );
  }
}

export async function sweepPreviewWorkers(
  options: SweepOptions,
): Promise<SweepResult> {
  const {
    accountId,
    cloudflareToken,
    githubToken,
    repo,
    ttlDays = DEFAULT_TTL_DAYS,
    dryRun = false,
    nowMs = Date.now(),
    fetchFn = fetch,
    log = console.log,
    errorLog = console.error,
  } = options;

  if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
    throw new Error(`Invalid TTL days: ${ttlDays}. Must be a positive number.`);
  }

  const workers = await listCloudflareWorkers(
    accountId,
    cloudflareToken,
    fetchFn,
  );
  const targets: readonly SweepTarget[] = workers.flatMap((worker) => {
    const prNumber = parsePreviewWorkerName(worker.id);
    return prNumber === null
      ? []
      : [
          {
            workerName: worker.id,
            prNumber,
            modifiedOn: worker.modified_on,
          },
        ];
  });

  log(
    `Found ${workers.length} Cloudflare Worker(s); ${targets.length} match ${PREVIEW_WORKER_PREFIX}* (TTL: ${ttlDays}d${dryRun ? ", dry-run" : ""}).`,
  );

  const pruned: string[] = [];
  const kept: string[] = [];
  const failed: string[] = [];

  for (const target of targets) {
    try {
      const pr = await fetchPullRequest(
        repo,
        target.prNumber,
        githubToken,
        fetchFn,
      );
      const decision = evaluateWorkerPrune(target, pr, ttlDays, nowMs);

      if (!decision.shouldPrune) {
        log(`Keeping ${target.workerName}: ${decision.reason}`);
        kept.push(target.workerName);
        continue;
      }

      if (dryRun) {
        log(`[dry-run] Would prune ${target.workerName}: ${decision.reason}`);
        pruned.push(target.workerName);
        continue;
      }

      await deleteCloudflareWorker(
        accountId,
        target.workerName,
        cloudflareToken,
        fetchFn,
      );
      log(`Pruned ${target.workerName}: ${decision.reason}`);
      pruned.push(target.workerName);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errorLog(`Failed to process ${target.workerName}: ${message}`);
      failed.push(target.workerName);
    }
  }

  log(
    `Sweep complete: ${pruned.length} pruned, ${kept.length} kept, ${failed.length} failed.`,
  );

  return {
    totalWorkers: workers.length,
    previewWorkers: targets.length,
    pruned,
    kept,
    failed,
  };
}

function getArg(args: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = args.find((a) => a.startsWith(prefix));
  if (inline !== undefined) {
    return inline.slice(prefix.length);
  }
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

function requireValue(value: string | undefined, label: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required ${label}.`);
  }
  return value.trim();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const ttlRaw = getArg(args, "ttl-days") ?? process.env.PREVIEW_TTL_DAYS;
  const ttlDays = ttlRaw !== undefined ? Number(ttlRaw) : DEFAULT_TTL_DAYS;

  const accountId = requireValue(
    getArg(args, "account-id") ?? process.env.CLOUDFLARE_ACCOUNT_ID,
    "CLOUDFLARE_ACCOUNT_ID or --account-id",
  );
  const cloudflareToken = requireValue(
    getArg(args, "cf-token") ?? process.env.CLOUDFLARE_API_TOKEN,
    "CLOUDFLARE_API_TOKEN or --cf-token",
  );
  const githubToken = requireValue(
    getArg(args, "gh-token") ?? process.env.GITHUB_TOKEN,
    "GITHUB_TOKEN or --gh-token",
  );
  const repo = requireValue(
    getArg(args, "repo") ?? process.env.GITHUB_REPOSITORY,
    "GITHUB_REPOSITORY or --repo",
  );

  const result = await sweepPreviewWorkers({
    accountId,
    cloudflareToken,
    githubToken,
    repo,
    ttlDays,
    dryRun,
  });

  if (result.failed.length > 0) {
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
