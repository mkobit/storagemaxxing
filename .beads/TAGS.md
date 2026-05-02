# Expanded Task Taxonomy & Tagging Guide

This guide expands the base tagging system to support the full lifecycle of the Storagemaxxing project, from core geometric research to high-fidelity UI polish.

## 1. Architectural Scope (`scope:<layer>`)
Refined to match the package structure and technical boundaries.
- `scope:engine`: Core packing logic, MaxRects, and solver workers.
- `scope:catalog`: Data modeling for bins, grids, and vendor specs.
- `scope:store`: Global state management and cross-package coordination.
- `scope:web-ui`: High-level React components and assembly views.
- `scope:web-canvas`: specialized 2D/3D rendering logic (SVG/Three.js).
- `scope:geometry`: Pure geometric primitives and math.
- `scope:infra`: CI, build tools, project scaffolding, and beads config.

## 2. Product Domain (`domain:<system>`)
Identifies the organizational system or physical storage category.
- `domain:gridfinity`: 42mm modular grid tasks.
- `domain:neogrid`: 28mm divider-based systems.
- `domain:schaller`: Schaller-specific drawer bin tasks.
- `domain:akromils`: Shelf-based "stack & hang" systems.
- `domain:interop`: Multi-system compatibility and 84mm bridge logic.
- `domain:drawer`: Generic top-access packing and features.
- `domain:shelf`: Generic front-access packing and 2.5D stacking.

## 3. Task Nature (`type:<nature>`)
Beyond the core Beads `issue_type`, these labels provide stylistic nuance.
- `type:research`: Spikes, feasibility studies, and math explorations (e.g., WASM solver perf).
- `type:refactor`: Structural cleanup without behavioral changes.
- `type:feature`: New functional capabilities.
- `type:ux-polish`: Visual refinements, fraction input feel, and layout density.
- `type:regression`: Fixes for features that were previously working.
- `type:performance`: Optimizations for the reactive packing loop or solver.

## 4. Workflow Gates (`status:<gate>`)
- `status:needs-spec`: Task is identified but lacks technical detail or PRD alignment.
- `status:needs-design`: Requires UX/UI wireframes or visual decisions.
- `status:needs-repro`: Bug requires a confirmed reproduction script/test.
- `status:blocked-by-human`: Agent is stuck on a product/design decision.

## 5. Implementation Strategy (`meta:<strategy>`)
- `meta:wasm`: Tasks involving GLPK.js, HiGHS.js, or other compiled modules.
- `meta:worker`: Tasks involving asynchronous background processing.
- `meta:client-only`: Ensuring logic remains zero-backend compatible.
- `meta:breaking`: Indicates a change to the core `Project` or `Assembly` schema.

## 6. Project & Beads Hygiene (`meta:beads-*`)
Specialized tags for maintaining the issue database and agent operational rails.
- `meta:beads-flow`: Improvements to the Beads operational loop, `PRIME.md`, or workflow formulas.
- `meta:beads-infra`: Tasks related to the Dolt database, git hooks, or CI integrations for beads.
- `meta:hygiene`: General maintenance of the backlog, such as re-triaging, adding detail to existing specs, or cleaning up stale issues.
- `meta:agent-rails`: Updates to `GEMINI.md`, `AGENTS.md`, or other agent-facing operational documentation.

---

## Example Usage Scenarios

**Scenario: Optimizing the WASM solver for large shelf arrays**
`bd update sm-xxx --add-label scope:engine --add-label domain:shelf --add-label type:performance --add-label meta:wasm`

**Scenario: Adding fraction support to a new input field**
`bd create "Support 1/16th increments" -l scope:web-ui,type:ux-polish,meta:polish`

**Scenario: Researching STEP file parsing feasibility**
`bd create "STEP parsing spike" -y spike -l scope:geometry,type:research,status:research`

---

[← Back to Operational Loop (.beads/PRIME.md)](PRIME.md)
