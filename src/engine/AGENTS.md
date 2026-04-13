# engine — agent mandate

**Mandate:**
This directory contains pure packing algorithms (e.g., MaxRects). Absolutely NO side effects are permitted.

**Hard Rules:**
- NO side effects, NO DOM access, NO I/O, NO external state mutation.
- ONLY pure functions.
- NO `try`/`catch` or `throw` statements. Handle errors functionally.
- Permitted dependencies: `model`, `catalog`.
- NO imports from `ui`, `store`, `solver`, or `workers`.
