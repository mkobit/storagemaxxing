## Context

The current `apps/web` environment uses a manual `serve.ts` file and `bun build` command.
This setup lacks Hot Module Replacement (HMR) and relies on brittle inline styles.
Our testing baseline is outdated and contains unmaintained E2E tests.
The monorepo contains several small packages (`geometry`, `store`, etc.) that are consumed by the web app, but their integration is not optimized for rapid development.

## Goals / Non-Goals

**Goals:**
- Implement a Vite-based development and build pipeline for `apps/web`.
- Establish a semantic styling system using Tailwind CSS with custom tokens.
- Reset the testing baseline with Vitest and a fresh Playwright configuration.
- Optimize monorepo package consumption for instant HMR updates.
- Maintain a purely static output for deployment.

**Non-Goals:**
- Transitioning to a server-side rendered (SSR) architecture.
- Full refactoring of all existing UI components (beyond the core layout and foundation).
- Introducing a complex state management alternative (staying with Zustand).

## Architecture & Data Flow

```ascii
[ Dev Environment ] <---> [ Vite Dev Server (HMR) ]
                                |
        +-----------------------+-----------------------+
        |                       |                       |
        v                       v                       v
[ apps/web ]          [ packages/store ]      [ packages/geometry ]
(Orchestrator)        (State/Persistence)     (Pure Functional Math)
        |                       |                       |
        +-----------+-----------+-----------+-----------+
                    |
                    v
            [ Tailwind CSS (Tokens) ]
                    |
                    v
            [ Static Build (dist) ]
```

## Domain Objects & Schemas

No new core business domain objects are introduced in this infrastructure-focused change.
However, we will establish a standard for semantic UI metadata.

```typescript
import { z } from "zod";

/**
 * Metadata for interactive elements to support agentic vision and testing.
 */
export const AgenticMetadataSchema = z.object({
  "data-testid": z.string(),
  "aria-label": z.string().optional(),
  "role": z.string().optional(),
}).readonly();
```

## Decisions

### 1. Vite for Build & Dev
Vite replaces `serve.ts` and the manual `bun build` step.
It provides out-of-the-box HMR and excellent workspace resolution for our monorepo packages.

### 2. Tailwind CSS via Vite Plugin
We will use `@tailwindcss/vite` to avoid explicit PostCSS configuration.
This allows us to focus on defining a custom token system within the Tailwind configuration.

### 3. Testing Reset
All old `apps/web/e2e` tests and `serve.ts` will be deleted.
A clean baseline will be established using Vitest (for unit/integration) and Playwright (for high-level smoke tests).

### 4. Semantic UI Primitives
We will prioritize `data-testid` and semantic HTML tags to ensure the UI is "machine-readable" for future agentic interactions.

## Adversarial Audit

### 1. Workspace Resolution Failures
- **Risk:** Vite fails to pick up changes in `packages/geometry` without a restart.
- **Mitigation:** Ensure `vite.config.ts` correctly leverages Bun's module resolution and that packages are properly listed in `package.json`.

### 2. Tailwind Token Mismatch
- **Risk:** Custom tokens defined in Tailwind are not applied or conflict with legacy styles.
- **Mitigation:** Explicitly refactor core layout components (like `Toolbar`) to use the new tokens first and verify with visual inspection.

### 3. Static Build Bloat
- **Risk:** Vite includes unnecessary polyfills or assets in the `dist` folder.
- **Mitigation:** Run `bun run build` and analyze the output size during the implementation phase.

## Risks / Trade-offs

- **Trade-off:** Resetting the testing baseline means losing some old test coverage. We accept this in exchange for a high-integrity, maintainable suite.
- **Risk:** Migrating styling to Tailwind is a manual process. We will prioritize the foundation and core layout to prove the pattern.
