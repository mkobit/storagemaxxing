## Why

The project requires a foundational vertical slice to establish core spatial primitives and a reliable deployment pipeline.
Standardizing 2D domain objects early ensures that future systems like NeoGrid can build on a robust, type-safe base.
Providing a tool to optimize print-ready board sizes against physical printer bed constraints addresses a practical entry point for users.
Establishing a fully static website built with Bun ensures high performance and seamless deployment to Cloudflare with preview branch support.

## What Changes

A new set of 2D spatial primitives and modeling logic will be implemented in the core geometry package.
The web application will be refactored to ensure it is fully static and utilizes Bun-native build processes for Cloudflare Pages deployment.
A vertical slice feature will be added to model OpenGrid fill patterns and validate them against configurable printer bed dimensions.
Strong domain modeling using TypeScript's strict mode and functional purity will be enforced for all new primitives.

## Capabilities

### New Capabilities

- `spatial-primitives`: Foundational 2D domain objects (Point, Rectangle, Size) with strict typing and Zod validation.
- `opengrid-2d-modeling`: Logic to calculate and model OpenGrid fill patterns based on target dimensions.
- `print-bed-optimization`: Calculation logic to fit modeled grids within physical printer bed constraints with conventional defaults.
- `static-web-foundation`: Production-ready Bun-based build pipeline optimized for Cloudflare Pages.

### Modified Capabilities

- `geometry-core`: Enhancement of existing geometry primitives to support multi-unit calculations and functional immutability.

## Impact

The `packages/geometry` package will receive new core domain objects that serve as the project's "laws of physics."
The `apps/web` application will transition to a fully static build output compatible with Cloudflare Pages.
Monorepo topology will be strictly enforced, ensuring `apps/web` depends on the pure functional packages.
CI/CD workflows will be updated to support Cloudflare PR environments.

## Success Criteria

The web application must build successfully using `bun build` and produce a fully static distribution.
A 2D pane must accurately render OpenGrid fill patterns based on user-provided dimensions.
The system must correctly identify and flag fill patterns that exceed the defined printer bed capability.
All geometry logic must be implemented as pure functional code with no mutations and 100% test coverage for primitives.
The affected systems must include Layer 1 (Synchronous Geometric Fitting) and the Web UI layer.
