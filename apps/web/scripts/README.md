# Web scripts

## Overview

Contains standalone Bun and Playwright CLI scripts and helpers for `apps/web`, covering Storybook console and WCAG accessibility verification, Cloudflare Workers PR preview comment management, and automated UI screenshot capture.

## Interface

- `[check-stories.ts:CLI]` Standalone script with no exports; builds static Storybook (or reads `STORYBOOK_STATIC_DIR`), serves it in-process on `127.0.0.1:0`, and checks `THEMES` (`"light"`, `"dark"`) in parallel (`CHECK_STORIES_CONCURRENCY`, default `min(4, availableParallelism())`) against `WCAG_TAGS` (`"wcag2a"`, `"wcag2aa"`, `"wcag21a"`, `"wcag21aa"`).
- `[comment-pr-preview.ts:COMMENT_MARKER]` Exported string constant `"<!-- cloudflare-preview-deployment -->"`.
- `[comment-pr-preview.ts:DeployOutputEntry]` Exported interface `{ type?: string; targets?: readonly string[]; url?: string; worker_name?: string }`.
- `[comment-pr-preview.ts:CommentOptions]` Exported interface `{ repo: string; prNumber: number; token: string; body: string; updateOnly?: boolean; fetchFn?: typeof fetch }`.
- `[comment-pr-preview.ts:extractPreviewUrl]` Exported function `(outputContent: string, prNumber: number) => string`.
- `[comment-pr-preview.ts:formatCommentBody]` Exported function `(previewUrl: string, commitSha?: string, timestamp?: string) => string`.
- `[comment-pr-preview.ts:formatTeardownCommentBody]` Exported function `(prNumber: number, timestamp?: string) => string`.
- `[comment-pr-preview.ts:verifyUrlStatus]` Exported function `(url: string, maxAttempts?: number, delayMs?: number, fetchFn?: typeof fetch, requestTimeoutMs?: number) => Promise<void>`.
- `[comment-pr-preview.ts:postOrUpdateComment]` Exported function `(options: CommentOptions) => Promise<void>`.
- `[comment-pr-preview.ts:main]` CLI entrypoint (`import.meta.main`) accepting `--pr`, `--repo`, `--commit`, `--output-file`, `--preview-url`, `--teardown`, `--dry-run`, and `--skip-verify` flags along with `PR_NUMBER`, `GITHUB_REPOSITORY`, `GITHUB_SHA`, and `GITHUB_TOKEN` environment variables.
- `[screenshot-recipes.ts:SCREENSHOT_RECIPES]` Exported map of Playwright page setup callbacks: `"constraint-row"`, `"accessory-constraint"`, and `"options-mode"`.
- `[screenshot.ts:CLI]` Standalone script with no exports; accepts positional `[route]` (default `"/"`) and `--recipe=<name>`.

## Invariants

- `[check-stories.ts:buildStaticStorybook]` Throws if `bunx storybook build --quiet` exits non-zero or exceeds `BUILD_TIMEOUT_MS` (`120_000` ms); `[check-stories.ts:checkStory]` times out after `STORY_TIMEOUT_MS` (`10_000` ms) and treats `"errored"` Storybook render phases as errors alongside console/page errors.
- `[check-stories.ts:storyIds]` Throws if `storyIds.length === 0`; sets `process.exitCode = 1` if `allErrors.length > 0` or `allViolations.length > 0`.
- `[comment-pr-preview.ts:main]` Exits with code 1 if `--pr` or `PR_NUMBER` is missing or parses as `NaN`.
- `[comment-pr-preview.ts:extractPreviewUrl]` Throws if no `workers.dev` or `http` URL is found in Wrangler JSON lines or regex match.
- `[comment-pr-preview.ts:verifyUrlStatus]` Throws if the preview URL does not return HTTP 200 within `maxAttempts` (default 30, 2000 ms delay, 5000 ms timeout).
- `[comment-pr-preview.ts:postOrUpdateComment]` Throws if a GitHub API list, update, or create response is not ok; skips comment creation when `updateOnly` is true and no `COMMENT_MARKER` comment exists.
- `[screenshot.ts:recipeName]` Exits with code 1 if `--recipe=<name>` is not a key in `SCREENSHOT_RECIPES`.
- `[screenshot.ts:page.goto]` Exits with code 1 if `http://localhost:5173${route}` is unreachable within `5_000` ms; requires `[data-testid="toolbar"]` within `10_000` ms.

## Side effects

- `[check-stories.ts:storybook]` Spawns `bunx storybook build --quiet` into `apps/web/storybook-static` (unless `STORYBOOK_STATIC_DIR` is set), serves static files and `/__axe.js` via `Bun.serve` stopped in `finally`, launches headless Chromium across concurrent `BrowserContext` workers with `a11y.manual:!true`, writes to stdout/stderr, and sets `process.exitCode`.
- `[comment-pr-preview.ts:main]` Reads `--output-file` from disk via `node:fs` `readFileSync`; sends HTTP `GET` requests to the preview URL (`verifyUrlStatus`) and `GET`/`PATCH`/`POST` requests to `https://api.github.com/repos/...` (`postOrUpdateComment`); logs to console and may call `process.exit(1)`.
- `[screenshot.ts:screenshot]` Creates `../../../.screenshots` (`mkdirSync` recursive); launches headless Chromium (`1280x800`) against `http://localhost:5173`; writes `.screenshots/latest.png` and copies it to `.screenshots/<timestamp>.png`; logs the path or calls `process.exit(1)`.
- `[screenshot-recipes.ts:SCREENSHOT_RECIPES]` Mutates Playwright `Page` UI state by filling inputs, selecting options, and clicking buttons on the running web app.

## Verification

- Run: `bun run --filter @storagemaxxing/web test`
