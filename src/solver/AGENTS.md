# solver — agent mandate

**Mandate:**
This directory holds the GLPK.js formulation and worker message protocols.

**Hard Rules:**
- Responsible for transforming domain models into LP/MIP formulations.
- Defines the exact message protocol types for communication with web workers.
- Permitted dependencies: `model`, `engine`.
- NO imports from `ui` or `store`.
