# ui/canvas — agent mandate

**Mandate:**
This directory contains Three.js WebGL components.

**Hard Rules:**
- All Three.js resources (geometries, materials, renderers) MUST be disposed of in `useEffect` cleanup.
- NO direct mutations of the `store`.
- Follow the rules of the parent `ui` package.
