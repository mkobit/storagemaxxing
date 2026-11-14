# Web app (`@storagemaxxing/web`)

## Overview

Configures the `@storagemaxxing/web` React and Vite frontend package, including workspace source aliases, TypeScript, Bun test preload, Playwright end-to-end projects, Cloudflare Wrangler deployment, and the HTML entry point.

## Interface

- `[package.json:name]` `@storagemaxxing/web` (`private: true`, `type: "module"`).
- `[package.json:scripts]` `build` (`vite build`), `build-storybook` (`storybook build`), `check-stories` (`bun scripts/check-stories.ts`), `deploy` (`wrangler deploy`), `dev` (`vite`), `playwright:install` (`playwright install chromium --with-deps`), `preview` (`vite preview`), `preview:comment` (`bun scripts/comment-pr-preview.ts`), `preview:deploy` (`wrangler deploy`), `preview:teardown` (`wrangler delete`), `screenshot` (`bun scripts/screenshot.ts`), `storybook` (`storybook dev -p 6006`), `test` (`bun test src scripts`), `test:e2e` (`playwright test`), `test:watch` (`bun test --watch src`), `typecheck` (`tsc --noEmit`).
- `[index.html:root]` Mounts `#root` and loads module `/src/index.tsx`.
- `[vite.config.ts:resolve.alias]` Maps `@storagemaxxing/catalog/lookup` (to `e2e/fixtures/catalogWithDrillFixture.ts` when `E2E_DRILL_FIXTURE === "true"`, else `../../packages/catalog/src/lookup.ts`) and `@storagemaxxing/{geometry,catalog,packer,store,assembly}` to `../../packages/*/src`.
- `[vite.config.ts:server]` Listens on `localhost` at `Number(process.env.PORT ?? 5173)` and builds to `outDir: "dist"`.
- `[playwright.config.ts:projects]` Runs `./e2e` across `chromium` (`grepInvert: /@drill-fixture/`, port `PORT ?? 5175`) and `chromium-e2e-fixtures` (`grep: /@drill-fixture/`, port `DRILL_PORT ?? defaultPort + 1`).
- `[wrangler.jsonc:name]` `storagemaxxing-web` with `assets.directory` `"./dist"` and `compatibility_date` `"2026-08-11"`.
- `[wrangler.toml:name]` `storagemaxxing` with `pages_build_output_dir` `"dist"` and `compatibility_date` `"2024-05-15"`.
- Subdirectories:
  - [Web scripts](./scripts/README.md) — Standalone Bun and Playwright CLI scripts for Storybook checks, PR preview comments, and screenshots.
  - [Web source](./src/README.md) — Application entrypoint, React UI, and CP-SAT solver Web Worker.

## Invariants

- `[vite.config.ts:server.strictPort]` `strictPort: true` fails if the target port is unavailable.
- `[vite.config.ts:resolve.dedupe]` Deduplicates `react` and `react-dom`.
- `[vite.config.ts:build.emptyOutDir]` `emptyOutDir: true` empties `dist` on build.
- `[tsconfig.json:compilerOptions.strict]` `strict: true`, `checkJs: true`, `isolatedModules: true`, `noEmit: true`.
- `[playwright.config.ts:forbidOnly]` Forbids `.only` tests when `CI` is truthy; sets `retries: 2` and `workers: 1` in CI.
- `[playwright.config.ts:webServer]` Sets `reuseExistingServer: false` for both test web servers.
- `[bunfig.toml:test.preload]` Preloads `["./src/test-setup.ts"]` for `bun test`.

## Side effects

- `[index.html:script]` Inline IIFE reads `window.localStorage.getItem("storagemaxxing-theme")` and `window.matchMedia("(prefers-color-scheme: dark)")` and mutates `document.documentElement.classList.add("dark")` before first paint (ignoring thrown errors).
- `[playwright.config.ts:webServer]` Starts two `bun run dev` processes on `defaultPort` and `drillFixturePort` (latter with `E2E_DRILL_FIXTURE: "true"`).

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
