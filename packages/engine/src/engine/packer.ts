import { MaxRectsPacker } from 'maxrects-packer';
import { BinSpec } from '../assembly/BinSpec.js';
import { SpaceTemplate } from '../assembly/SpaceTemplate.js';
import { SpaceConstraint } from '../assembly/SpaceConstraint.js';
import { createPlacedBin } from '../assembly/PlacedBin.js';
import { createPoint3D } from '../geometry/Point3D.js';
import { PackingResult, ConstraintFailure, createConstraintFailure, createPackingMetrics, createPackingResult, ValidityState } from './types.js';
import { getEffectiveFootprint, getEffectiveSpaceDimensions, getMaxBinDepth } from './geometryUtils.js';

type PackRect = { readonly width: number; readonly height: number; readonly data: { readonly binId: string } };
type RectsAccumulator = readonly PackRect[];

const generateRects = (bin: BinSpec, count: number): RectsAccumulator => {
  if (count <= 0) return [];
  const footprint = getEffectiveFootprint(bin);
  return Array.from({ length: count }, () => ({ width: footprint.w, height: footprint.l, data: { binId: bin.id } }));
};

const generatePhaseRects = (
  constraints: readonly SpaceConstraint[],
  binMap: ReadonlyMap<string, BinSpec>,
  getCount: (c: SpaceConstraint) => number
): RectsAccumulator =>
  constraints.reduce((acc: RectsAccumulator, c) => {
    const bin = binMap.get(c.binId);
    return bin ? [...acc, ...generateRects(bin, getCount(c))] : acc;
  }, []);

const sortRects = (rects: RectsAccumulator): RectsAccumulator =>
  [...rects].sort((a, b) => b.width * b.height - a.width * a.height);
const getPlacedCount = (packer: MaxRectsPacker, binId: string): number =>
  packer.bins[0]?.rects.filter((r) => r.data.binId === binId).length || 0;

const checkPhaseFailures = (
  constraints: readonly SpaceConstraint[],
  packer: MaxRectsPacker,
  getRequired: (c: SpaceConstraint) => number,
  reason: 'hardMin' | 'softMin'
): readonly ConstraintFailure[] =>
  constraints
    .map((c) => ({ c, req: getRequired(c), placed: getPlacedCount(packer, c.binId) }))
    .filter(({ req, placed }) => placed < req)
    .map(({ c, req, placed }) => createConstraintFailure(c.binId, reason, req, placed));

const getHardMin = (c: SpaceConstraint): number => {
  if (c.mode === 'hard') return c.lo;
  if (c.mode === 'soft') return c.hardLo ?? 0;
  return 0;
};

const getSoftMin = (c: SpaceConstraint): number => {
  if (c.mode === 'soft') return c.lo;
  if (c.mode === 'hard') return c.softLo ?? c.lo;
  return 0;
};

const getMax = (c: SpaceConstraint): number | undefined => c.hi ?? undefined;

const checkHardMinPhase = (constraints: readonly SpaceConstraint[], packer: MaxRectsPacker) => {
  const failures = checkPhaseFailures(constraints, packer, getHardMin, 'hardMin');
  return { validity: failures.length > 0 ? ('invalid' as const) : ('valid' as const), failures };
};

const checkSoftMinPhase = (
  constraints: readonly SpaceConstraint[],
  packer: MaxRectsPacker,
  validity: ValidityState,
) => {
  if (validity !== 'valid') return { validity, failures: [] };
  const failures = checkPhaseFailures(constraints, packer, getSoftMin, 'softMin');
  return { validity: failures.length > 0 ? ('partial' as const) : ('valid' as const), failures };
};

const generateAutoFillRects = (
  constraints: readonly SpaceConstraint[],
  binMap: ReadonlyMap<string, BinSpec>,
  spaceArea: number,
): RectsAccumulator => {
  const unconstrained = constraints
    .filter((c) => getMax(c) === undefined)
    .map((c) => binMap.get(c.binId)!);
  if (unconstrained.length === 0) return [];
  const sorted = [...unconstrained].sort(
    (a, b) =>
      getEffectiveFootprint(b).w * getEffectiveFootprint(b).l -
      getEffectiveFootprint(a).w * getEffectiveFootprint(a).l,
  );
  return sorted.reduce((acc: RectsAccumulator, bin) => {
    const area = getEffectiveFootprint(bin).w * getEffectiveFootprint(bin).l;
    return area > 0 ? [...acc, ...generateRects(bin, Math.floor(spaceArea / area))] : acc;
  }, []);
};

const executePhases = (
  constraints: readonly SpaceConstraint[],
  binMap: ReadonlyMap<string, BinSpec>,
  packer: MaxRectsPacker,
  spaceArea: number,
) => {
  const add = (
    rects: RectsAccumulator, // @ts-expect-error MaxRectsPacker TS definitions are missing readonly annotations
  ) => packer.addArray(Array.from(rects));

  // eslint-disable-next-line functional/no-expression-statements
  add(sortRects(generatePhaseRects(constraints, binMap, getHardMin)));
  const hmCheck = checkHardMinPhase(constraints, packer);

  // eslint-disable-next-line functional/no-expression-statements
  add(
    sortRects(generatePhaseRects(constraints, binMap, (c) => Math.max(0, getSoftMin(c) - getHardMin(c)))),
  );
  const smCheck = checkSoftMinPhase(constraints, packer, hmCheck.validity);

  // eslint-disable-next-line functional/no-expression-statements
  add(
    sortRects(
      generatePhaseRects(constraints, binMap, (c) => {
        const max = getMax(c);
        const softMin = getSoftMin(c);
        const hardMin = getHardMin(c);
        return max !== undefined && max > softMin ? max - Math.max(hardMin, softMin) : 0;
      }),
    ),
  );

  // eslint-disable-next-line functional/no-expression-statements
  add(generateAutoFillRects(constraints, binMap, spaceArea));

  return { validity: smCheck.validity, failures: [...hmCheck.failures, ...smCheck.failures] };
};

export const packSpace = (space: SpaceTemplate, availableBins: readonly BinSpec[], constraints: readonly SpaceConstraint[]): PackingResult => {
  const dims = getEffectiveSpaceDimensions(space, getMaxBinDepth(availableBins));
  const spaceArea = dims.width * dims.depth;
  const binMap = new Map(availableBins.map((b) => [b.id, b]));

  const packer = new MaxRectsPacker(dims.width, dims.depth, 0, { smart: true, pot: false, square: false, allowRotation: false, tag: false });

  const { validity, failures } = executePhases(constraints, binMap, packer, spaceArea);

  const placedBins = (packer.bins[0]?.rects || []).map((r) => createPlacedBin(r.data.binId, createPoint3D(r.x, 0, r.y)));
  const placedCounts = placedBins.reduce((acc, bin) => ({ ...acc, [bin.binId]: (acc[bin.binId] || 0) + 1 }), {} as Record<string, number>);
  const areaUtil = placedBins.reduce((acc, bin) => acc + getEffectiveFootprint(binMap.get(bin.binId)!).w * getEffectiveFootprint(binMap.get(bin.binId)!).l, 0);

  return createPackingResult(placedBins, createPackingMetrics(placedCounts, spaceArea > 0 ? areaUtil / spaceArea : 0, failures), validity);
};
