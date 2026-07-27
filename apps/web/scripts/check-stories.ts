import AxeBuilder from "@axe-core/playwright";
import { chromium, type ConsoleMessage, type Page } from "@playwright/test";

const PORT = 6100;
const BASE_URL = `http://localhost:${PORT}`;
const THEMES = ["light", "dark"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

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

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const reachable = await fetch(url)
      .then((res) => res.ok)
      .catch(() => false);
    if (reachable) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Storybook did not become ready at ${url} within ${timeoutMs}ms`);
}

async function fetchStoryIds(): Promise<readonly string[]> {
  const res = await fetch(`${BASE_URL}/index.json`);
  const index = (await res.json()) as StoryIndex;
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story")
    .map((entry) => entry.id);
}

async function checkStory(
  page: Page,
  storyId: string,
  theme: (typeof THEMES)[number],
): Promise<{
  readonly consoleErrors: readonly ConsoleError[];
  readonly a11yViolations: readonly A11yViolation[];
}> {
  const errors: ConsoleError[] = [];
  const onConsole = (msg: ConsoleMessage): void => {
    if (msg.type() === "error") errors.push({ storyId, theme, message: msg.text() });
  };
  const onPageError = (err: Error): void => {
    errors.push({ storyId, theme, message: err.message });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    await page.goto(
      `${BASE_URL}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`,
      { waitUntil: "networkidle", timeout: 10_000 },
    );
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }

  const axeResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
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

const storybook = Bun.spawn(
  ["bunx", "storybook", "dev", "-p", String(PORT), "--ci", "--quiet", "--exact-port"],
  { stdout: "ignore", stderr: "pipe" },
);

try {
  await waitForServer(`${BASE_URL}/index.json`, 30_000);
  const storyIds = await fetchStoryIds();
  if (storyIds.length === 0) throw new Error("No stories found in Storybook index.");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const allErrors: ConsoleError[] = [];
  const allViolations: A11yViolation[] = [];
  for (const storyId of storyIds) {
    for (const theme of THEMES) {
      const { consoleErrors, a11yViolations } = await checkStory(page, storyId, theme);
      allErrors.push(...consoleErrors);
      allViolations.push(...a11yViolations);
    }
  }
  await browser.close();

  if (allErrors.length > 0) {
    console.error(`Found ${allErrors.length} console error(s) across stories:\n`);
    for (const { storyId, theme, message } of allErrors) {
      console.error(`  [${storyId}] (${theme}) ${message}`);
    }
  }

  if (allViolations.length > 0) {
    console.error(`\nFound ${allViolations.length} accessibility violation(s) across stories:\n`);
    for (const { storyId, theme, rule, impact, help, nodeCount } of allViolations) {
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
  storybook.kill();
  await storybook.exited;
}
