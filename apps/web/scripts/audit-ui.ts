import AxeBuilder from "@axe-core/playwright";
import { chromium, type ConsoleMessage } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const WEB_ROOT = resolve(import.meta.dirname, "..");
const DIST_DIR = resolve(WEB_ROOT, "dist");
const OUT_DIR = resolve(WEB_ROOT, ".screenshots/audit");
const BUILD_TIMEOUT_MS = 120_000;
const PAGE_TIMEOUT_MS = 15_000;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
] as const;

type AxeViolationSummary = {
  readonly help: string;
  readonly id: string;
  readonly impact: string;
  readonly nodeCount: number;
};

type ViewportReport = {
  readonly axeViolationCount: number;
  readonly axeViolations: readonly AxeViolationSummary[];
  readonly consoleErrors: readonly string[];
  readonly height: number;
  readonly horizontalOverflow: boolean;
  readonly innerWidth: number;
  readonly pageErrors: readonly string[];
  readonly screenshot: string;
  readonly scrollWidth: number;
  readonly viewport: (typeof VIEWPORTS)[number]["name"];
  readonly width: number;
};

type AuditReport = {
  readonly generatedAt: string;
  readonly viewports: readonly ViewportReport[];
};

async function buildWebApp(): Promise<void> {
  const proc = Bun.spawn(["bun", "run", "build"], {
    cwd: WEB_ROOT,
    detached: true,
    signal: AbortSignal.timeout(BUILD_TIMEOUT_MS),
    stdout: "inherit",
    stderr: "inherit",
  });

  try {
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      throw new Error(`Web build failed with exit code ${exitCode}`);
    }
  } finally {
    try {
      process.kill(-proc.pid, "SIGKILL");
    } catch {
      // Process group already exited
    }
    await proc.exited;
  }
}

function startStaticServer(distDir: string) {
  const resolvedRoot = resolve(distDir);
  return Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
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

await buildWebApp();
mkdirSync(OUT_DIR, { recursive: true });

const server = startStaticServer(DIST_DIR);
const baseUrl = `http://127.0.0.1:${server.port}`;

try {
  const browser = await chromium.launch();
  const viewports: ViewportReport[] = [];

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      const onConsole = (msg: ConsoleMessage): void => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      };
      const onPageError = (err: Error): void => {
        pageErrors.push(err.message);
      };

      page.on("console", onConsole);
      page.on("pageerror", onPageError);

      try {
        await page.goto(baseUrl, {
          waitUntil: "domcontentloaded",
          timeout: PAGE_TIMEOUT_MS,
        });
        await page.waitForSelector('[data-testid="toolbar"]', {
          timeout: PAGE_TIMEOUT_MS,
        });
        await page.evaluate(() => document.fonts.ready);

        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));

        const screenshotPath = resolve(OUT_DIR, `${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const axeResults = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze();

        viewports.push({
          axeViolationCount: axeResults.violations.length,
          axeViolations: axeResults.violations.map((v) => ({
            help: v.help,
            id: v.id,
            impact: v.impact ?? "unknown",
            nodeCount: v.nodes.length,
          })),
          consoleErrors,
          height: vp.height,
          horizontalOverflow: scrollWidth > innerWidth,
          innerWidth,
          pageErrors,
          screenshot: `.screenshots/audit/${vp.name}.png`,
          scrollWidth,
          viewport: vp.name,
          width: vp.width,
        });
      } finally {
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    viewports,
  };

  const reportPath = resolve(OUT_DIR, "report.json");
  await Bun.write(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Audit report written to .screenshots/audit/report.json`);
  for (const vp of viewports) {
    console.log(
      `  ${vp.viewport} (${vp.width}x${vp.height}): overflow=${vp.horizontalOverflow}, consoleErrors=${vp.consoleErrors.length}, pageErrors=${vp.pageErrors.length}, axeViolations=${vp.axeViolationCount}`,
    );
  }
} finally {
  server.stop(true);
}
