## 1. Programmatic Rails (ESLint & TS)

- [ ] 1.1 Install `eslint-plugin-functional` and `eslint-plugin-import` at the root.
- [ ] 1.2 Update `eslint.config.ts` to enforce functional/immutable rules in `packages/`.
- [ ] 1.3 Ensure `tsconfig.json` in each package has `strict: true` and `noImplicitAny: true`.
- [ ] 1.4 Add a `lint` and `typecheck` script to the root `package.json` that runs across all workspaces.

## 2. Infrastructure & CI

- [ ] 2.1 Create a `.github/workflows/ci.yml` that runs `lint`, `typecheck`, and `test` on every PR.
- [ ] 2.2 Configure Cloudflare Pages for branch previews and production deploys.
- [ ] 2.3 Add a basic Playwright "Smoke Test" in `apps/web/e2e/` to verify the dev server starts.

## 3. Agent Nudging

- [ ] 3.1 Update `GEMINI.md` with a "Technical Rails" section linking to these OpenSpec standards.
- [ ] 3.2 Add a Beads formula `bd mol pour engineering-sync` to help agents stay aligned with these rules.
