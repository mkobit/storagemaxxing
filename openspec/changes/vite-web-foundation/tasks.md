<!--
  IMPORTANT: After creating this file, you MUST hydrate it into Beads:
  bd mol pour openspec-sync --var change_name=vite-web-foundation
-->

## 1. Infrastructure & Build

- [x] 1.1 Clean Slate: Remove legacy web infrastructure (sm-pu05)
  - **Validation**: Remove apps/web/serve.ts, start_app.sh, and apps/web/e2e/*.spec.ts. ls apps/web/serve.ts should fail.
- [x] 1.2 Install Vite and core plugins (sm-vp9q)
  - **Validation**: bun add -D vite @vitejs/plugin-react in apps/web. bun run vite --version.
- [x] 1.3 Configure vite.config.ts (sm-dgto)
  - **Validation**: Create apps/web/vite.config.ts with React and static build settings. bun run build generates a dist folder.
- [x] 1.4 Update package.json scripts (sm-0i1g)
  - **Validation**: Update dev, build, preview scripts in apps/web/package.json. bun run dev starts Vite.

## 2. Styling & UI

- [x] 2.1 Install and configure Tailwind CSS via Vite (sm-34op)
  - **Validation**: bun add -D tailwindcss @tailwindcss/vite. Add plugin to vite.config.ts. Verify styles render in dev mode.
- [x] 2.2 Refactor Toolbar to use Tailwind tokens (sm-ytwn)
  - **Validation**: Apply Tailwind classes and data-testid to Toolbar.tsx. Visual check and test selector check.

## 3. Testing Baseline

- [x] 3.1 Initialize new Vitest baseline (sm-eomo)
  - **Validation**: Setup Vitest in apps/web. Create a sanity test. bun run test passes.
- [ ] 3.2 Initialize new Playwright smoke test (sm-5uqm)
  - **Validation**: Setup basic Playwright config and a smoke test. bun run test:e2e passes.
