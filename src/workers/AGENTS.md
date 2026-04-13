# workers — agent mandate

**Mandate:**
This directory manages web worker implementations and serves as the async boundary.

**Hard Rules:**
- Workers operate in an isolated scope. NO DOM access.
- Communication strictly via the message protocols defined in `solver`.
- NO imports from `ui` or `store`.
