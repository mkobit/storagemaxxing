# Reflection: product-realignment

## 🔍 Process Analysis

### 1. Beads Metadata

- **Turnaround Time**: All 12 child beads were claimed and closed within the change window; the claim → close → commit-per-bead loop held without drift.
- **Label Consistency**: Children carried consistent `domain:`/`scope:`/`type:` labels, but the change-link label (`meta:openspec:product-realignment`) only queries correctly with explicit `and` syntax — the documented query examples do not match the parser.
- **Bottlenecks**: bd `--json` output shapes are inconsistent (create → object, close → array), which broke inline parsing twice and produced one duplicate bead; piping output into `bun -e` extraction scripts also forces a user permission prompt per call.

### 2. OpenSpec Workflow

- **Design Clarity**: design.md gave enough shape to execute without re-litigating architecture; flowback was exercised twice (templatesById registry, selector naming) and worked.
- **Task Granularity**: One-bead-one-commit granularity was right; every task was independently verifiable with a named test or lint gate.
- **Artifact Friction**: Engagement was kickoff-heavy — no rule says which discovered work must touch spec artifacts versus a bead alone, so mid-execution decisions defaulted to beads-only; the generated `project_context` also drifted from reality ("Vitest for unit tests").

### 3. Multi-Agent Coordination

- **Sync Fidelity**: Single-agent session; `bd dolt push` after bead writes and git push after each PR kept remote state truthful throughout.
- **Guidewire Compliance**: AGENTS.md itself contained a broken command (`bun --cwd packages/<pkg> test`) and a harmful recommendation (`[run] bun = true`), both discovered only when followed — rails need the same test-against-reality discipline as code.

## 🚀 Follow-up Actions

- **[ ] sm-lg32**: define the OpenSpec-vs-Beads boundary and pursue spec alignment across all agent tools post-stabilization (`meta:beads-flow`).
- **[ ] sm-ng6j**: fix beads integration guidance so interactive agents use plain output instead of permission-prompting JSON pipes (`meta:beads-flow`).
- **[ ] sm-8jvf**: keep openspec `project_context` in sync with tooling reality when decisions change (`meta:openspec-schema`).
