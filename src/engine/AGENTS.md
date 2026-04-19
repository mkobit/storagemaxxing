# engine/

## Responsibility
This package handles all packing algorithms. It consists purely of placement logic, MaxRects implementations, orientation enforcement, and metrics computation.

## Type Ownership
Owns: `PlacedItem`, `PackingResult`, `PackingMetrics`, `TierSet`, `PackingPhase`.

## Import Rules
- **May import from**: `geometry/`, `catalog/`.
- **Must not import from**: `solver/`, `assembly/`, `store/`, `workers/`, `ui/`.
- **Other rules**: Must contain purely pure functions. Zero side effects. Same inputs must yield same outputs.
