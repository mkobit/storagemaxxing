# Follow-up: OR-Tools WASM Migration

## Context
The current Phase 0 engine uses GLPK.js. The PRD (§7.0) notes that OR-Tools is developing a WASM/JS port.

## Objective
Monitor the status of the OR-Tools WASM port. If it becomes stable and significantly out-performs GLPK.js (especially for CP-SAT capabilities), we should plan a migration to unify the solver logic.

## Linked Beads
- Decision: `001-two-layer-packing-engine.md`
- Tech: `tech.md`

## Next Steps
- Periodically check [OR-Tools GitHub](https://github.com/google/or-tools) for WASM releases.
- Prototype a basic feasibility check with OR-Tools if/when available.
