## 1. Programmatic Rails (ESLint & TS)

- [x] 1.1 Install `eslint-plugin-functional` and `eslint-plugin-import` at the root.
- [x] 1.2 Update `eslint.config.ts` to enforce functional/immutable rules in `packages/`.
- [x] 1.3 Ensure `tsconfig.json` in each package has `strict: true` and `noImplicitAny: true`.
- [x] 1.4 Add a `lint` and `typecheck` script to the root `package.json` that runs across all workspaces.

## 2. Infrastructure & CI

- [x] 2.1 Create a `.github/workflows/ci.yml` that runs `lint`, `typecheck`, and `test` on every PR.
- [x] 2.2 Configure Cloudflare Pages for branch previews and production deploys.
- [x] 2.3 Add a basic Playwright "Smoke Test" in `apps/web/e2e/` to verify the dev server starts.

## 3. Agent Nudging

- [x] 3.1 Update `GEMINI.md` with a \"Technical Rails\" section linking to these OpenSpec standards.
- [x] 3.2 Add a Beads formula `bd mol pour engineering-sync` to help agents stay aligned with these rules.
