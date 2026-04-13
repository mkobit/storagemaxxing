# ui — agent mandate

**Mandate:**
This directory contains purely visual React components. State should be read exclusively from the `store` via selectors.

**Hard Rules:**
- Local component state is allowed ONLY for ephemeral UI state.
- Application state must come from `store`.
- Components must be stateless when it comes to business logic.
- Permitted dependencies: `store`, `model`.
