## Purpose

Define the "Agentic Prime" directive that serves as the foundational operational contract for all AI agents in the Storagemaxxing repository.

## Requirements

### Requirement: Unified Agentic Prime

All AI agents SHALL reference `AGENTS.md` at the root of the repository as their primary source of architectural and operational truth.

#### Scenario: Agent initializing context

- **WHEN** an agent (Gemini, Claude, or Jules) starts a new session
- **THEN** it MUST read `AGENTS.md` and adhere to the "Engineering Rails" and "Breadth of Rectangles" philosophy.

### Requirement: Breadth of Rectangles Default

Agents SHALL default to 2D geometric fitting logic and modular systems unless an OpenSpec Architectural Exception is explicitly defined.

#### Scenario: Proposing a new engine feature

- **WHEN** an agent proposes a new system (e.g., NeoGrid)
- **THEN** it MUST first define a 2D Fitter logic in a pure functional package before considering 3D visualization or complex constraints.
