import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { SCREENSHOT_RECIPES } from "./screenshot-recipes";

const args = process.argv.slice(2);
const recipeArg = args.find((arg) => arg.startsWith("--recipe="));
const recipeName = recipeArg?.slice("--recipe=".length);
const route = args.find((arg) => !arg.startsWith("--")) ?? "/";
const outDir = resolve(import.meta.dirname, "../../..", ".screenshots");

if (recipeName !== undefined && !(recipeName in SCREENSHOT_RECIPES)) {
  console.error(
    `Unknown recipe "${recipeName}". Available: ${Object.keys(SCREENSHOT_RECIPES).join(", ")}`,
  );
  process.exit(1);
}

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

if (recipeName !== undefined) {
  await SCREENSHOT_RECIPES[recipeName](page);
}

const latestPath = resolve(outDir, "latest.png");
await page.screenshot({ path: latestPath, fullPage: true });
await browser.close();

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
copyFileSync(latestPath, resolve(outDir, `${timestamp}.png`));

console.log(`.screenshots/latest.png`);
