import { chromium, type ConsoleMessage, type Page } from "@playwright/test";

const PORT = 6100;
const BASE_URL = `http://localhost:${PORT}`;
const THEMES = ["light", "dark"] as const;

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
): Promise<readonly ConsoleError[]> {
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
  return errors;
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
  const page = await browser.newPage();
  const allErrors: ConsoleError[] = [];
  for (const storyId of storyIds) {
    for (const theme of THEMES) {
      allErrors.push(...(await checkStory(page, storyId, theme)));
    }
  }
  await browser.close();

  if (allErrors.length > 0) {
    console.error(`Found ${allErrors.length} console error(s) across stories:\n`);
    for (const { storyId, theme, message } of allErrors) {
      console.error(`  [${storyId}] (${theme}) ${message}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      `Checked ${storyIds.length} stor${storyIds.length === 1 ? "y" : "ies"} x ${THEMES.length} themes -- no console errors.`,
    );
  }
} finally {
  storybook.kill();
  await storybook.exited;
}
