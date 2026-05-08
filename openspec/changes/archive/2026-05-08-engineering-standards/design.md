## Context

We are building a "Two-Layer" engine in a semi-greenfield monorepo. To ensure consistency across AI-driven development cycles, we must formalize our engineering approach. This design moves from "informal suggestions" to "programmatic guardrails" that are enforced by the build system.

## Goals / Non-Goals

**Goals:**
- Enforce functional programming (pure functions) in logic packages.
- Enforce immutability (no `let`, no mutations) where possible.
- Define a clear "Data Handshake" between main-thread UI and background Workers.
- Maximize testability via Vitest and UX automation via Playwright.

**Non-Goals:**
- Enforcing functional style in UI-heavy React components (where `useEffect` or `useState` are necessary).
- Solving specific domain problems (e.g., how to pack a bin).

## Decisions

### 1. Functional Rails via ESLint
We will use `eslint-plugin-functional` to enforce immutability and purity in core packages (`packer`, `solver`, `geometry`).
- **Rationale**: Humans and AIs both make mistakes; the build system should be the "Design Authority" for style.

### 2. Multi-Package Monorepo Topology
- `packages/geometry`: Pure math/geometric primitives. Zero dependencies.
- `packages/catalog`: Domain definitions. Depends on `geometry`.
- `packages/packer`: Geometric placement. Pure functional. Depends on `catalog`, `geometry`.
- `packages/solver`: Constraint satisfaction. Web-worker compatible.
- `apps/web`: React 19 UI. The only place allowed to have "side effects" (DOM, persistence).

### 3. Automated Verification & Deployment
- **Site Deploy**: Cloudflare Pages.
- **Workflow**: PRs trigger branch previews. Merge to `main` triggers production deploy (Green Deploy).
- **UX Automation**: Playwright tests are not just for regressions; they are our "Feature Probes" to verify UX intent.

## Programmatic Guardrails (Draft)

### ESLint Configuration (Targets)
```typescript
// eslint.config.ts target rules
{
  plugins: { functional },
  rules: {
    "functional/no-let": "error",
    "functional/immutable-data": "error",
    "functional/no-expression-statements": "warn", // Nudge toward return values
    "functional/prefer-readonly-type": "error",
  }
}
```

### TypeScript Strategy
- `strict: true` across all packages.
- No `any`. Use `unknown` + Zod validation at boundaries.
- Prefer `ReadonlyArray` and `ReadonlyMap`.

## Risks / Trade-offs

- **[Risk]**: Strict functional rules can make simple UI tasks verbose.
- **[Mitigation]**: Scoped ESLint rules (strict in `packages/`, pragmatic in `apps/`).
- **[Trade-off]**: Monorepo overhead (multiple `package.json` files).
- **[Mitigation]**: Use Bun's workspace management to keep linking and execution fast.
