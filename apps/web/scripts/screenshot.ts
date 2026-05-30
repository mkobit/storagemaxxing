import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const route = process.argv[2] ?? "/";
const outDir = resolve(import.meta.dirname, "../../..", ".screenshots");

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto(`http://localhost:5173${route}`, { timeout: 5_000 });
} catch {
  await browser.close();
  console.error(`dev server not reachable at http://localhost:5173 — run 'bun run dev' first`);
  process.exit(1);
}

await page.waitForSelector('[data-testid="toolbar"]', { timeout: 10_000 });

const latestPath = resolve(outDir, "latest.png");
await page.screenshot({ path: latestPath, fullPage: true });
await browser.close();

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
copyFileSync(latestPath, resolve(outDir, `${timestamp}.png`));

console.log(`.screenshots/latest.png`);
