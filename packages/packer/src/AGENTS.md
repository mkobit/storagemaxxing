# packer/

## Responsibility

This package contains spatial layout algorithms and pure geometric calculations. It houses placement heuristics and 2D bin packing logic, and owns the input shape consumed by `packSpace`.

## Type Ownership

```ts-exports
PackInput
PackInputSchema
PackRect
RectsAccumulator
checkHardMinPhase
checkPhaseFailures
checkSoftMinPhase
createPackInput
createPackInputBasic
generateAutoFillRects
generatePhaseRects
generateRects
getEffectiveFootprint
getEffectiveSpaceDimensions
getHardMin
getMax
getMaxBinDepth
getPlacedCounts
getSoftMin
packSpace
sortRects
toPackInput
```

## Import Rules

- **May import from**: `geometry/`, `catalog/`, `assembly/`
- **Must not import from**: `store/`, `web/`
- **Other rules**: Must be 100% pure functions. No classes. No state. Outputs must be entirely deterministic based on inputs.
