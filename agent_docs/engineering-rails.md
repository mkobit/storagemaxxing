# Engineering Rails (The Laws of Physics)

- **Functional Purity:** All logic in `packages/geometry`, `packages/catalog`, and `packages/packer` MUST be pure functional. No side effects.
- **Immutability:** Use `const` and `readonly`. No `let`, no object mutation. Enforced by ESLint `functional/*` rules.
- **Strict Typing:** `strict: true` in all packages. No `any`. Use `unknown` + narrowing/validation.
- **tsconfig Scope:** When adding TypeScript files outside a package's `src/` directory (e.g., `scripts/`, `e2e/`), verify the directory is listed in that package's `tsconfig.json` `include` array or ESLint will fail to parse it.
- **Monorepo Topology:** Lint-enforced directed acyclic graph: `geometry → catalog → assembly → packer → store → web`. Upward or lateral imports fail `bun run lint`.
- **Engine:** Layer 1 only — synchronous 2D geometric fitting (pure functions) in `packages/packer`. Layer 2 (asynchronous constraint validation) is deferred and has no package.
