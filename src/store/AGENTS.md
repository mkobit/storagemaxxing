# store — agent mandate

**Mandate:**
This directory manages global application state using Zustand. All updates must be strictly immutable, and state reads must happen via selectors.

**Hard Rules:**
- NO direct mutation of state objects or arrays.
- Define pure, targeted selectors for `ui` to consume.
- Permitted dependencies: `model`, `engine`, `solver`, `catalog`.
- NO imports from `ui`.
