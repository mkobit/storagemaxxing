## Why

Currently, storage planning is restricted to simple rectangular volumes, which fails to represent real-world storage scenarios like irregular entryway cubbies, drawers with internal dividers, or shelf bays with varying access constraints.
Users need a high-fidelity way to define the physical boundaries and operational characteristics of their storage spaces to enable accurate automated packing and options comparison.
Standardizing the space model now allows the Packing Engine to move beyond simple box-filling to sophisticated, access-aware optimization.

## What Changes

- Implement a **Polygon-Based Space Modeler** that supports non-rectangular footprints.
- Introduce **Access Face Configuration** as a first-class property of every space (top-down vs. front-access).
- Add support for **Internal Geometry Modifiers** including persistent dividers and fixed obstacles (e.g., plumbing pipes, bars).
- Establish a **SpaceTemplate / SpaceInstance** data model to allow reusable geometry across complex assemblies.

## Capabilities

### New Capabilities
- `space-geometry-engine`: Core logic for managing polygon-based footprints and coordinate systems in `packages/geometry`.
- `access-orientation-logic`: Rules and validation for space access types (top, front, etc.) that drive packing depth rules.
- `obstacle-collision-primitives`: Data structures for representing fixed obstacles that must be subtracted from the available packing area.

### Modified Capabilities
- `monorepo-topology`: Geometry package will now export complex polygon types used by the Packer.

## Impact

- **Packages**: `packages/geometry` will be expanded with polygon utilities; `packages/packer` will be updated to respect non-rectangular bounds and access-based depth limits.
- **Web UI**: A new canvas interaction layer for sketching footprints and placing obstacles.

## Success Criteria

- Spaces can be defined using arbitrary polygons with 1/8" precision.
- The system correctly identifies "unreachable" depth in front-access spaces during packing validation.
- Fixed obstacles are accurately masked out, preventing bin placement in those regions.
- Space definitions can be serialized/deserialized via Zod-validated JSON for persistence.
