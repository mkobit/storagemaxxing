## ADDED Requirements

### Requirement: Bun-Based Static Build
The web application SHALL utilize `bun build` to generate a fully static distribution without requiring a Node.js runtime for production.

#### Scenario: Build Output
- **WHEN** `bun run build` is executed
- **THEN** it MUST produce a `dist/` directory containing only HTML, CSS, and JS assets.

### Requirement: Cloudflare Pages Compatibility
The build configuration SHALL be compatible with Cloudflare Pages' build environment and deployment standards.

#### Scenario: Deployment Verification
- **WHEN** the `dist/` directory is deployed to Cloudflare Pages
- **THEN** the application MUST be accessible and functional without any server-side logic (e.g., SSR).

### Requirement: 2D Modeling Pane
The web UI SHALL provide an interactive 2D pane for visualizing modeled grids and printer bed boundaries.

#### Scenario: Visualization
- **WHEN** a user enters dimensions
- **THEN** the 2D pane MUST update in real-time to show the grid layout and highlight any "out of bounds" areas relative to the printer bed.
