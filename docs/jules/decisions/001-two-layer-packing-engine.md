# Decision: Two-Layer Packing Engine Architecture

**Status:** Accepted
**Date:** 2026-04-29

## Context
We need a layout engine that is both fast (interactive) and mathematically sound (handles complex constraints). Single-layer solvers (MIP for everything) are too slow for real-time canvas updates. Single-layer geometric packers (MaxRects only) cannot handle global limits or aggregate minimums across multiple spaces.

## Decision
We will implement a two-layer architecture:

1.  **Layer 1 (Sync): MaxRects BAF.** Handles geometric bin placement on the main thread. Responds instantly to drag/drop or dimension changes. It takes "Target Quantities" as input.
2.  **Layer 2 (Async): GLPK.js in a Web Worker.** Solves the Mixed-Integer Program to determine if user-defined constraints (min/max/global) are feasible. It provides the "Target Quantities" to Layer 1.

## Consequences
- **Positive:** Interactive UI remains responsive; complex assembly-level constraints are mathematically verified.
- **Negative:** Requires state management for the "Handoff" between async solver results and sync layout rendering.
- **Risk:** If Layer 2 proves too slow for even simple problems, we may need to implement lightweight geometric heuristics before calling the solver.
