# Storagemaxxing | Architectural Rails

## 🏗 Code Philosophy
- **Immutability:** `const` and `readonly` everywhere. No `let` or shared state mutation.
- **Atomic:** Small files, one export per file, named exports only (no defaults).
- **Strict Typing:** No `any`. Use `unknown` + narrowing.
- **Dependencies:** Flow downwards: `ui` → `store` → (`assembly`, `packer`, `solver`) → `catalog` → `geometry`.
- **Pure Cores:** `geometry/`, `packer/`, and `catalog/` must be 100% pure functions.

## 📦 Structure
- **Package API:** Barrel files (`index.ts`) only at package roots.
- **No Cycles:** Strictly enforced `import/no-cycle`.

## 📖 Reference
- **Workflows & Triage:** [.beads/PRIME.md](.beads/PRIME.md)
- **Tagging:** [.beads/TAGS.md](.beads/TAGS.md)
- **Product Docs:** [docs/jules/](docs/jules/)
