# model — agent mandate

**Mandate:**
This directory contains TYPES ONLY. It is the absolute foundation of the codebase. Everything else imports from here; `model` imports from NOTHING outside of this directory.

**Hard Rules:**
- NO runtime logic, NO functions.
- NO imports from `ui`, `store`, `engine`, `catalog`, `solver`, or `workers`.
- Only `export type` or `export interface`.
