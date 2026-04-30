# Constraints: Grid Systems & Packing Logic

This "bead" defines the physical and mathematical constraints for the Storagemaxxing packing engine.

## 1. Grid Standards

### 1.1 Gridfinity
- **Base Unit:** 42.0 mm
- **Tolerance:** 0.5 mm (subtracted from footprint: `42 * units - 0.5`)
- **Z-Height:** 7.0 mm increments
- **Interoperability Factor:** 2 units = 84 mm

### 1.2 NeoGrid / openGrid
- **Base Unit:** 28.0 mm
- **Divider Thickness:** 3.0 mm (standard)
- **Interoperability Factor:** 3 units = 84 mm

### 1.3 84mm Common Multiple
The 84mm dimension is the bridge between systems.
- `3 * 28mm == 2 * 42mm == 84mm`
- Baseplate adapters should align on 84mm boundaries to support mixed-system spaces.

## 2. Access Orientation Rules

### 2.1 Top Access (Drawers)
- **Rule:** Full utilization of (W, L) footprint.
- **Goal:** Maximize 2D packing density.

### 2.2 Front Access (Shelves)
- **Rule:** One-row-deep default.
- **Effective Depth:** `min(spaceL, binL + 1.0 inch)`
- **Exception:** User override allows deeper packing but triggers "Reduced Accessibility" warning.

## 3. Solver Constraints (GLPK.js)

### 3.1 Hard Minimums
- Layout is `invalid` if `count[i] < min[i]`.

### 3.2 Global Limits
- Total count across all spaces in an assembly must satisfy `Σ count[i,s] ≤ limit[i]`.

### 3.3 Geometric Capacity
- Solver must use `floor(availableArea / binArea)` as an upper bound for each variable to avoid trivial infeasibility.
