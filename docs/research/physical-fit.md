# Physical fit limits of the synchronous packer

This report records bounded research for Bead `sm-36gr` at base `749b0c2b2242af51106f2732b3540df7a67d63b9`.
The executable evidence is [physicalFitProbe.test.ts](../../packages/packer/src/physicalFitProbe.test.ts).
No production behavior or solver contract changes in this work.

## Assumptions

All dimensions use one consistent unit, treated as inches to match the [obstacle and divider schemas](../../packages/assembly/src/BaseTypes.ts).
The coordinate convention is width `x`, height `y`, and depth `z`, as emitted by [packSpace](../../packages/packer/src/packer.ts).
The front edge is `z = 0`.
Bins are rigid axis-aligned boxes with no nesting or stacking.
Touching edges do not overlap.
Rotation means a 90-degree turn in the `x,z` plane and requires an orientation representation if supported later.
For the physical front-access comparison, every bin must be removable along a straight path toward decreasing `z` without moving another bin.
This comparison does not model hands, handles, lifting, tipping, or diagonal extraction.
For the grid comparison, origins must lie on a lattice anchored at zero with pitch `gridResolution`.
That lattice interpretation is a research assumption, not a current packing requirement.
A permanent obstacle occupies its declared volume, and the divider fixture spans the full depth and height.
Back clearance is informational under the current proposal, so exclusion is only a hypothetical physical comparison.
These assumptions precede the probe edits and do not add requirements.

## Sources and contract boundaries

The [Golden-Path Packing requirement](../../openspec/specs/storage-layout/spec.md) requires bounds, no overlapping bin placements, minimum-demand failure reporting, and height filtering.
It does not require rotation, grid snapping, extraction paths, or obstacle exclusion.
The [reach clearance proposal](../../openspec/changes/reach-clearance-display/proposal.md) explicitly keeps full depth `l` for packing and defers exclusion to epic `sm-t45l`.
The [space schema](../../packages/assembly/src/SpaceTemplate.ts) carries grid, obstacle, divider, and clearance data, but the existence of those fields does not establish enforcement by the packer.
The [packing implementation](../../packages/packer/src/packer.ts) disables rotation and converts rectangle coordinates to origins `(x, 0, z)`.
The [geometry helpers](../../packages/packer/src/geometryUtils.ts) add dimension tolerances and clamp front depth to `min(space.l, max eligible bin depth)`.
That maximum uses all height-eligible available bins before footprint and constraint filtering.
The [phase helpers](../../packages/packer/src/packerUtils.ts) sort demanded rectangles by descending area and evaluate counts in the first packing page.
The [placement type](../../packages/assembly/src/PlacedBin.ts) has an ID and an origin, with no orientation field.
The existing [packer tests](../../packages/packer/src/packer.test.ts) already establish uniform front-depth clamping, positive tolerance, and height behavior.
No external solver, OR-Tools decoder, worker, or benchmark is used here.

## Reproduction and runtime method

Run the commands from the repository root with the existing toolchain.

```bash
bun test packages/packer/src/physicalFitProbe.test.ts
bunx prettier --check docs/research/physical-fit.md
```

The probe defines 14 fixed fixtures with explicit IDs, dimensions, constraints, and expected output.
Each fixture asserts exact placement order, origins, counts, utilization, failures, and validity, then repeats the call to check determinism.
Four additional tests verify the physical evidence for extraction, grid alignment, obstruction, and clearance.
One additional test reports runtime, for a total of 19 tests without skipped cases.
Each fixture prints its full output as one JSON object.
The timing test performs 10 warmup calls and 100 measured calls per fixture in fixture order.
It measures each synchronous `packSpace()` call with `performance.now()` and sorts the duration samples.
It reports minimum, median as the mean of samples 50 and 51, and nearest-rank p95 as sample 95, in milliseconds.
Fixture construction, output assertions, summary conversion, module loading, and console reporting are outside the timed interval.
Allocation and garbage collection inside a measured call remain included.
There is no runtime assertion or performance budget.

An initial guest run used Bun `1.4.3 (c6da4a4d3)` on Linux.
The initial timing sample is recorded below to establish scale, not a speed guarantee.
The unrounded timing summaries are in `.sbx-task/logs/probe-discovery.log` for the host handoff.
Reruns can differ with JIT state, garbage collection, host load, and timer resolution.
The table rounds milliseconds to six decimal places.

| Fixture                       | Minimum ms | Median ms |   p95 ms |
| ----------------------------- | ---------: | --------: | -------: |
| `rotation-required`           |   0.003997 |  0.007430 | 0.128144 |
| `rotation-transposed-control` |   0.014193 |  0.021792 | 0.063912 |
| `front-uniform`               |   0.019190 |  0.064285 | 0.193215 |
| `front-mixed`                 |   0.015893 |  0.037609 | 0.501186 |
| `top-mixed-control`           |   0.012936 |  0.017663 | 0.051418 |
| `front-unrequested-depth`     |   0.010126 |  0.012212 | 0.049935 |
| `grid-coarse`                 |   0.008712 |  0.011036 | 0.036464 |
| `grid-fine-control`           |   0.008506 |  0.013190 | 0.046639 |
| `obstacle`                    |   0.005224 |  0.022073 | 0.137486 |
| `divider`                     |   0.004987 |  0.006094 | 0.030836 |
| `clearance`                   |   0.004840 |  0.005887 | 0.040960 |
| `clearance-zero-control`      |   0.004828 |  0.005732 | 0.031883 |
| `tolerance-zero-control`      |   0.008933 |  0.010382 | 0.036041 |
| `tolerance-positive`          |   0.011345 |  0.012722 | 0.022659 |

## Fixed inputs

Dimensions below are `width × depth × height`.
All spaces have height `4`, and all bins have height `1`.
Every constraint uses a hard minimum and equal maximum, with soft minimum `0`.
There is no automatic fill in these fixtures.
Unless specified, access is `top`, grid resolution is `0.5`, tolerances are absent, and there are no obstacles, dividers, or clearance.

| Fixture                       | Space and bins                                                 | Demand and changed metadata                                      |
| ----------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `rotation-required`           | Space `4 × 6 × 4`; `wide` is `6 × 4 × 1`                       | One `wide`                                                       |
| `rotation-transposed-control` | Same space; `wide` is `4 × 6 × 1`                              | One `wide`, with transposed input dimensions                     |
| `front-uniform`               | Space `4 × 8 × 4`; `shallow` is `2 × 2 × 1`                    | Four `shallow`; access `front`                                   |
| `front-mixed`                 | Same space and shallow bin; `deep` is `2 × 6 × 1`              | One `deep`, three `shallow`; access `front`                      |
| `top-mixed-control`           | Same mixed inputs                                              | Same demand; access `top`                                        |
| `front-unrequested-depth`     | Same front space and shallow bin; `unrequested` is `4 × 8 × 1` | Four `shallow`; no constraint for `unrequested`                  |
| `grid-coarse`                 | Space `5 × 2 × 4`; `fractional` is `2.5 × 2 × 1`               | Two `fractional`; grid `2`                                       |
| `grid-fine-control`           | Same grid inputs                                               | Same demand; grid `0.5`                                          |
| `obstacle`                    | Space `4 × 4 × 4`; `square` is `4 × 4 × 1`                     | One `square`; permanent post at `(1,0,1)`, size `1 × 1 × 2`      |
| `divider`                     | Same square inputs                                             | One `square`; divider on axis `x`, position `2`, thickness `0.5` |
| `clearance`                   | Same square inputs                                             | One `square`; `backClearance = 2`                                |
| `clearance-zero-control`      | Same square inputs                                             | One `square`; `backClearance = 0`                                |
| `tolerance-zero-control`      | Space `4 × 4 × 4`; `shallow` is `2 × 2 × 1`                    | Four `shallow`                                                   |
| `tolerance-positive`          | Same tolerance inputs                                          | Same demand; width and depth tolerance `0.25` each               |

## Current output

Origins below show `(x,z)` because every emitted `y` is zero.
Placement sequences match the executable golden output in the probe.
Counts include only placed IDs.
Utilization uses effective bin area divided by effective packing area, which can differ from full physical space area for front access.

| Fixture                       | Validity  | Placements in order                                                | Counts                  | Area utilization | Failures                                   |
| ----------------------------- | --------- | ------------------------------------------------------------------ | ----------------------- | ---------------: | ------------------------------------------ |
| `rotation-required`           | `invalid` | None                                                               | `{}`                    |                0 | `wide`: `hardMin`, required 1, placed 0    |
| `rotation-transposed-control` | `valid`   | `wide@(0,0)`                                                       | `wide: 1`               |                1 | None                                       |
| `front-uniform`               | `invalid` | `shallow@(0,0)`, `shallow@(2,0)`                                   | `shallow: 2`            |                1 | `shallow`: `hardMin`, required 4, placed 2 |
| `front-mixed`                 | `valid`   | `deep@(0,0)`, `shallow@(2,0)`, `shallow@(2,2)`, `shallow@(2,4)`    | `deep: 1`, `shallow: 3` |                1 | None                                       |
| `top-mixed-control`           | `valid`   | Same sequence as `front-mixed`                                     | `deep: 1`, `shallow: 3` |             0.75 | None                                       |
| `front-unrequested-depth`     | `valid`   | `shallow@(0,0)`, `shallow@(2,0)`, `shallow@(0,2)`, `shallow@(2,2)` | `shallow: 4`            |              0.5 | None                                       |
| `grid-coarse`                 | `valid`   | `fractional@(0,0)`, `fractional@(2.5,0)`                           | `fractional: 2`         |                1 | None                                       |
| `grid-fine-control`           | `valid`   | Same sequence as `grid-coarse`                                     | `fractional: 2`         |                1 | None                                       |
| `obstacle`                    | `valid`   | `square@(0,0)`                                                     | `square: 1`             |                1 | None                                       |
| `divider`                     | `valid`   | `square@(0,0)`                                                     | `square: 1`             |                1 | None                                       |
| `clearance`                   | `valid`   | `square@(0,0)`                                                     | `square: 1`             |                1 | None                                       |
| `clearance-zero-control`      | `valid`   | `square@(0,0)`                                                     | `square: 1`             |                1 | None                                       |
| `tolerance-zero-control`      | `valid`   | `shallow@(0,0)`, `shallow@(2,0)`, `shallow@(0,2)`, `shallow@(2,2)` | `shallow: 4`            |                1 | None                                       |
| `tolerance-positive`          | `invalid` | `shallow@(0,0)`                                                    | `shallow: 1`            |       0.31640625 | `shallow`: `hardMin`, required 4, placed 1 |

## Physical expectation

These comparisons follow the stated assumptions and do not redefine `validity`.

| Topic                    | Physical expectation                                                                                                | Evidence and implication                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Rotation                 | One `6 × 4` bin fits a `4 × 6` footprint after a 90-degree turn                                                     | The transposed control fits exactly; the current input orientation does not                       |
| Uniform front access     | At most two width-2 bins can have independent straight front extraction in width 4                                  | `front-uniform` places exactly those two at `z = 0`                                               |
| Mixed-depth front access | The deep bin and one shallow bin can share the front edge; three shallow bins cannot all be independently extracted | The shallow bins at `z = 2` and `z = 4` share `x = [2,4]` with the bin at `z = 0`                 |
| Unrequested depth        | Adding a bin with no demand should not change access for the same four shallow bins                                 | The shallow count changes from 2 to 4 and the result changes from `invalid` to `valid`            |
| Grid                     | With pitch 2 and origin zero, `x = 2.5` is outside the lattice                                                      | Two width-2.5 bins cannot fit with both origins on that lattice in width 5; pitch 0.5 admits both |
| Obstacle                 | A full-space bin cannot coexist with the permanent post                                                             | Their intersection is `x = [1,2]`, `z = [1,2]`, `y = [0,1]`                                       |
| Divider                  | A full-space bin intersects the assumed full-span divider                                                           | The positive-width intersection is `x = [2,2.5]` across the bin depth and height                  |
| Back clearance           | If clearance were exclusion, usable depth would be 2 and the depth-4 bin would not fit                              | The bin occupies all of the rear depth band `[2,4]`; current informational semantics allow this   |
| Dimension tolerance      | Each positive-tolerance shallow bin occupies an effective `2.25 × 2.25` footprint                                   | Only one fits the `4 × 4` space without rotation; utilization is `5.0625 / 16`                    |

## Supported behavior

The fixtures support fixed-orientation rectangular packing with explicit count failures when demanded footprints cannot fit.
They support a single depth band for uniform front-access bins under the tested dimensions.
They show deterministic placement for the fixed cases and additive positive width and depth tolerance.
The top-access mixed fixture uses 24 of 32 square units without bin overlap.
The front-access mixed fixture reports utilization of 1 because its effective depth is 6 rather than physical depth 8.
The clearance pair confirms the proposal's full-depth packing behavior.
Existing contract tests cover height filtering and related failure states; this probe does not expand that coverage.

## Deferred behavior

Rotation requires a decision about allowed orientations, bin identity, returned orientation, and rendering before a fitter change.
Independent front extraction requires a decision between a strict front row, per-bin extraction corridors, and layouts that permit moving other bins.
Grid enforcement requires a decision about units, lattice origin, whether sizes or only origins snap, and treatment of tolerance.
Obstacle and divider exclusion require a decision about occupied volumes, height intersections, permanence, and nonrectangular free space.
Clearance exclusion requires later specification because the current proposal explicitly treats clearance as informational.
Per-side gaps, insertion clearance, and hand clearance are not equivalent to the current additive dimension tolerances.
No fixture establishes support for polygon footprints, stacking, 3D motion, global optimality, large-catalog performance, or mixed-system compatibility.
No change to the OR-Tools work is proposed or measured.

## Confirmed defects and limits

No violation of the cited Golden-Path Packing requirement is demonstrated by these fixtures.
All observed bin footprints remain within the rectangular packing bounds and do not overlap other bins.
The following physical defects are confirmed only under the stated independent front-extraction assumption.
They need a contract decision before production repair.

| Finding                                                   | Reproducer                                             | Confirmed evidence                                                                         | Boundary                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Front depth clamping does not guarantee individual access | `front-mixed`                                          | Two shallow extraction paths cross another shallow footprint despite `valid`               | Access-path feasibility is absent from the cited requirement                                       |
| Unrequested inventory changes front capacity and validity | Compare `front-uniform` with `front-unrequested-depth` | Same space and demand produce counts 2 and 4 because unused inventory widens the depth cap | The helper's current input dependency explains the output; demand-only invariance is not specified |

The rotation and grid results are unsupported capabilities, rather than confirmed contract defects.
The obstacle and divider results are confirmed physical collisions under the stated assumptions, but obstacle enforcement is not specified in the cited packing contract.
The clearance result is expected current behavior and is not a defect.
A later OpenSpec proposal should state the chosen access and exclusion semantics before implementation work starts.
The host owns any follow-up Beads and integration decisions.

## Evidence limits

These are small synthetic fixtures, not measurements from physical drawers or manufacturer tolerances.
A transposed input demonstrates geometric feasibility but does not test an automatic rotation API.
The obstacle and divider cases expose ignored metadata and do not evaluate a subtraction algorithm.
The timing sample measures only the existing synchronous heuristic on these fixtures and cannot compare solver approaches.
Exact origins are stored as `Float32Array` by the existing geometry API; these fixtures use exactly representable halves and quarters.
The probe records current behavior so that a deliberate future contract change must also revise these observations.
Guest check results, process state, and environment limits are recorded separately in `.sbx-task/handoff.md`.
