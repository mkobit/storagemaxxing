import AxeBuilder from "@axe-core/playwright";
import { chromium, type ConsoleMessage, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";

const THEMES = ["light", "dark"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const BUILD_TIMEOUT_MS = 120_000;
const STORY_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = Math.max(1, Math.min(4, availableParallelism()));
const CONCURRENCY = Math.max(
  1,
  Number(process.env.CHECK_STORIES_CONCURRENCY ?? DEFAULT_CONCURRENCY),
);

const WEB_ROOT = resolve(import.meta.dirname, "..");

type StoryIndexEntry = {
  readonly id: string;
  readonly type: string;
};

type StoryIndex = {
  readonly entries: Readonly<Record<string, StoryIndexEntry>>;
};

type ConsoleError = {
  readonly storyId: string;
  readonly theme: (typeof THEMES)[number];
  readonly message: string;
};

type A11yViolation = {
  readonly storyId: string;
  readonly theme: (typeof THEMES)[number];
  readonly rule: string;
  readonly impact: string;
  readonly help: string;
  readonly nodeCount: number;
};

type StoryCheckTask = {
  readonly storyId: string;
  readonly theme: (typeof THEMES)[number];
};

type StoryCheckResult = {
  readonly consoleErrors: readonly ConsoleError[];
  readonly a11yViolations: readonly A11yViolation[];
};

async function buildStaticStorybook(): Promise<string> {
  const configuredDir = process.env.STORYBOOK_STATIC_DIR;
  if (configuredDir) {
    return resolve(process.cwd(), configuredDir);
  }

  const outDir = resolve(WEB_ROOT, "storybook-static");
  const proc = Bun.spawn(["bunx", "storybook", "build", "--quiet"], {
    cwd: WEB_ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, BUILD_TIMEOUT_MS);

  try {
    const exitCode = await proc.exited;
    if (timedOut) {
      throw new Error(`Storybook build timed out after ${BUILD_TIMEOUT_MS}ms`);
    }
    if (exitCode !== 0) {
      throw new Error(`Storybook build failed with exit code ${exitCode}`);
    }
  } finally {
    clearTimeout(timer);
  }

  return outDir;
}

function startStaticServer(staticDir: string) {
  const requireFromAxe = createRequire(
    Bun.resolveSync("@axe-core/playwright", import.meta.dirname),
  );
  const axeFile = Bun.file(requireFromAxe.resolve("axe-core/axe.min.js"));
  const resolvedRoot = resolve(staticDir);

  return Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/__axe.js") {
        return new Response(axeFile, {
          headers: {
            "content-type": "application/javascript",
            "cache-control": "public, max-age=3600, immutable",
          },
        });
      }

      const rel =
        url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const filePath = resolve(resolvedRoot, `.${rel}`);
      if (
        !filePath.startsWith(`${resolvedRoot}/`) &&
        filePath !== resolvedRoot
      ) {
        return new Response("Forbidden", { status: 403 });
      }

      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        return new Response("Not found", { status: 404 });
      }

      const headers: Record<string, string> = rel.startsWith("/assets/")
        ? { "cache-control": "public, max-age=3600, immutable" }
        : {};
      return new Response(file, { headers });
    },
  });
}

async function fetchStoryIds(staticDir: string): Promise<readonly string[]> {
  const indexFile = Bun.file(resolve(staticDir, "index.json"));
  const index = (await indexFile.json()) as StoryIndex;
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story")
    .map((entry) => entry.id);
}

async function checkStory(
  page: Page,
  baseUrl: string,
  storyId: string,
  theme: (typeof THEMES)[number],
): Promise<StoryCheckResult> {
  const errors: ConsoleError[] = [];
  const onConsole = (msg: ConsoleMessage): void => {
    if (msg.type() === "error") {
      errors.push({ storyId, theme, message: msg.text() });
    }
  };
  const onPageError = (err: Error): void => {
    errors.push({ storyId, theme, message: err.message });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    // Suppress addon-a11y's automatic afterEach scan so Axe runs once below
    // with our exact WCAG_TAGS rather than duplicating axe-core execution.
    await page.goto(
      `${baseUrl}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
      { waitUntil: "domcontentloaded", timeout: STORY_TIMEOUT_MS },
    );

    const renderPhase = await page
      .waitForFunction(
        () => {
          const root = document.getElementById("storybook-root");
          if (!root || root.childElementCount === 0) return null;
          const preview = (
            window as unknown as {
              __STORYBOOK_PREVIEW__?: {
                storyRenders?: ReadonlyArray<{ readonly phase?: string }>;
              };
            }
          ).__STORYBOOK_PREVIEW__;
          const phase = preview?.storyRenders?.[0]?.phase;
          return phase === "finished" || phase === "errored" ? phase : null;
        },
        undefined,
        { timeout: STORY_TIMEOUT_MS },
      )
      .then((handle) => handle.jsonValue());

    await page.evaluate(() => document.fonts.ready);

    if (renderPhase === "errored") {
      const errorText = await page.evaluate(() => {
        const el = document.querySelector(".sb-errordisplay");
        return el?.textContent?.trim() || "Story render entered errored phase";
      });
      errors.push({ storyId, theme, message: errorText });
    }
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }

  await page.addScriptTag({ url: `${baseUrl}/__axe.js` });
  const axeResults = await new AxeBuilder({ page, axeSource: "void 0;" })
    .setLegacyMode(true)
    .withTags(WCAG_TAGS)
    .analyze();

  const a11yViolations = axeResults.violations.map((violation) => ({
    storyId,
    theme,
    rule: violation.id,
    impact: violation.impact ?? "unknown",
    help: violation.help,
    nodeCount: violation.nodes.length,
  }));

  return { consoleErrors: errors, a11yViolations };
}

const staticDir = await buildStaticStorybook();
const storyIds = await fetchStoryIds(staticDir);
if (storyIds.length === 0) {
  throw new Error("No stories found in Storybook index.");
}

const server = startStaticServer(staticDir);
const baseUrl = `http://127.0.0.1:${server.port}`;

try {
  const tasks: readonly StoryCheckTask[] = storyIds.flatMap((storyId) =>
    THEMES.map((theme) => ({ storyId, theme })),
  );
  const results = new Array<StoryCheckResult>(tasks.length);
  let nextIndex = 0;

  const browser = await chromium.launch();
  try {
    const workerCount = Math.min(CONCURRENCY, tasks.length);
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        try {
          while (true) {
            const idx = nextIndex++;
            const task = tasks[idx];
            if (!task) break;
            results[idx] = await checkStory(
              page,
              baseUrl,
              task.storyId,
              task.theme,
            );
          }
        } finally {
          await context.close();
        }
      }),
    );
  } finally {
    await browser.close();
  }

  const allErrors = results.flatMap((r) => r.consoleErrors);
  const allViolations = results.flatMap((r) => r.a11yViolations);

  if (allErrors.length > 0) {
    console.error(
      `Found ${allErrors.length} console error(s) across stories:\n`,
    );
    for (const { storyId, theme, message } of allErrors) {
      console.error(`  [${storyId}] (${theme}) ${message}`);
    }
  }

  if (allViolations.length > 0) {
    console.error(
      `\nFound ${allViolations.length} accessibility violation(s) across stories:\n`,
    );
    for (const {
      storyId,
      theme,
      rule,
      impact,
      help,
      nodeCount,
    } of allViolations) {
      console.error(
        `  [${storyId}] (${theme}) ${rule} (${impact}): ${help} -- ${nodeCount} node(s)`,
      );
    }
  }

  if (allErrors.length > 0 || allViolations.length > 0) {
    process.exitCode = 1;
  } else {
    console.log(
      `Checked ${storyIds.length} stor${storyIds.length === 1 ? "y" : "ies"} x ${THEMES.length} themes -- no console errors, no accessibility violations.`,
    );
  }
} finally {
  server.stop(true);
}
