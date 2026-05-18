## Purpose

Define security boundaries and execution policies for autonomous agents to ensure safe operation within the repository and cloud environments.

## Requirements

### Requirement: Platform Alignment

The system SHALL prioritize native platform sandboxing for Cloud-hosted agents (Claude, Gemini) while enforcing custom boundaries for local agents.

#### Scenario: Agent tool execution

- **WHEN** Gemini executes a tool in its native sandbox
- **THEN** it MUST adhere to the project's root workspace restrictions defined in `AGENTS.md`.
