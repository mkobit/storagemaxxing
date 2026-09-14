# Engineering Rails (The Laws of Physics)

- **Functional Purity:** All logic in `packages/geometry`, `packages/catalog`, and `packages/packer` MUST be pure functional. No side effects.
- **Immutability:** Use `const` and `readonly`. No `let`, no object mutation. Enforced by ESLint `functional/*` rules.
- **Strict Typing:** `strict: true` in all packages. No `any`. Use `unknown` + narrowing/validation.
- **tsconfig Scope:** When adding TypeScript files outside a package's `src/` directory (e.g., `scripts/`, `e2e/`), verify the directory is listed in that package's `tsconfig.json` `include` array or ESLint will fail to parse it.
- **Monorepo Topology:** Lint-enforced directed acyclic graph: `geometry → catalog → assembly → packer → store → web`. Upward or lateral imports fail `bun run lint`.
- **Engine:** Layer 1 only — synchronous 2D geometric fitting (pure functions) in `packages/packer`. Layer 2 (asynchronous constraint validation) is deferred and has no package.

## Core development loop & layer boundaries

- **Layer specialization:** Focus exclusively on foundational packages (`packages/geometry`, `packages/catalog`, `packages/assembly`, `packages/packer`, `packages/store`). UI/UX (`apps/web`) is delegated to specialized interface agents.
- **TDD first:** Write failing tests establishing domain assertions before writing production code; iterate in small, composable units.
- **Tight domain modeling:** Use nominal or branded types, discriminated unions with compile-time exhaustiveness, and explicit domain bounds instead of loose primitives.
- **Zero speculative code:** Implement strictly what is required for the target contract; never add unrequested abstractions or overwrite functioning code without failing test justification.
