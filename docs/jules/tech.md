# Technical Rails: Storagemaxxing Tech Stack

## Core Architecture: Two-Layer Packing Engine

Storagemaxxing uses a hybrid approach to spatial optimization, splitting the problem between synchronous geometric placement and asynchronous constraint satisfaction.

### Layer 1: Geometric Placement (MaxRects BAF)
- **Tool:** `packages/packer/src/packer.ts`
- **Algorithm:** MaxRects Best Area Fit.
- **Runtime:** Synchronous, running on the main UI thread.
- **Responsibility:** Deterministically places bins within a space based on quantity targets. It handles the "physics" of fit, including tolerances.
- **Output:** `PlacedBin[]` and geometric validity.

### Layer 2: Constraint Satisfaction (GLPK.js)
- **Tool:** `packages/solver/src/workers/constraintWorker.ts`
- **Algorithm:** Mixed-Integer Programming (MIP).
- **Runtime:** Asynchronous, running in a Web Worker.
- **Responsibility:** Validates if a set of user constraints (min/max/hard/soft) can be satisfied within the space's capacity.
- **Output:** Feasibility status (`feasible: boolean`), suggested counts, and conflict reports.

## Frontend Standards
- **Framework:** React 19 (TypeScript).
- **State Management:** Zustand (`packages/store/src/useStore.ts`).
- **Styling:** Tailwind CSS.
- **Canvas:** SVG for 2D floor plans, Three.js for 3D visualizations (Phase 1+).
- **Interactions:** Use standard React hooks (`useMemo`, `useEffect`) but offload heavy computation (Solver) to Web Workers.

## Coding Standards
- **Strict Types:** No `any`. Use Zod for runtime validation where appropriate.
- **Functional Style:** Prefer immutability and pure functions in the engine packages.
- **Testing:**
  - Unit tests: `vitest` for all logic in `packages/`.
  - E2E: Playwright for user flows in `apps/web/e2e/`.
- **Package Management:** Bun for execution and lockfile management.

## Project Structure
- `apps/web/`: The React application.
- `packages/assembly/`: High-level project and assembly models.
- `packages/catalog/`: Vendor and open-system bin specifications.
- `packages/geometry/`: Shared geometric primitives (Point2D, Box3D, etc.).
- `packages/packer/`: The MaxRects implementation.
- `packages/solver/`: The Web Worker and GLPK.js integration.
- `packages/store/`: Central application state.
