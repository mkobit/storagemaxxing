## Why

The current web foundation relies on a custom `serve.ts` and manual `bun build` scripts that lack Hot Module Replacement (HMR).
This results in a slow developer experience and high friction when iterating on UI components.
We need a modern, high-velocity foundation that leverages Vite and Bun to support rapid prototyping and future agentic vision capabilities.

## What Changes

We will migrate `apps/web` to use Vite as the primary development and build tool.
The custom `serve.ts` and `start_app.sh` scripts will be removed in favor of standard Vite commands.
Tailwind CSS will be introduced via the modern Vite plugin to establish a semantic, token-based styling system.
The testing baseline will be reset, replacing outdated Playwright tests with a clean Vitest and Playwright configuration.
We will optimize the setup to leverage our existing small monorepo packages for better isolation and build performance.

## Capabilities

### New Capabilities

- `vite-web-foundation`: Establishes the core Vite + Bun + Tailwind infrastructure for the web application.

### Modified Capabilities

- `automated-verification`: Requirements for how we verify the web application (resetting the testing baseline).

## Impact

- `apps/web`: Complete overhaul of the build and development infrastructure.
- `packages/*`: Improved integration and HMR performance when linked to the web app.
- CI/CD: The static build pipeline will be updated to use `vite build`.

## Success Criteria

- Hot Module Replacement (HMR) is functional for both `apps/web` and linked monorepo packages.
- The build process produces a purely static `dist` folder compatible with Cloudflare Pages.
- A clean testing baseline is established with passing Vitest and Playwright smoke tests.
- UI styling is managed via Tailwind CSS using a custom token system.

## Affected Layers

This change primarily affects the Web UI layer and its orchestration of the underlying packages.
It does not directly modify the core logic of the Packer or Solver layers, but improves their developer integration.
