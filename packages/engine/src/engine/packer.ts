import { MaxRectsPacker } from 'maxrects-packer';
import { BinSpec } from '../assembly/BinSpec.js';
import { SpaceTemplate } from '../assembly/SpaceTemplate.js';
import { SpaceConstraint } from '../assembly/SpaceConstraint.js';
import { createPlacedBin } from '../assembly/PlacedBin.js';
import { createPoint3D } from '../geometry/Point3D.js';
import { PackingResult, createPackingMetrics, createPackingResult } from './types.js';
import {
  getEffectiveFootprint,
  getEffectiveSpaceDimensions,
  getMaxBinDepth,
} from './geometryUtils.js';
import {
  RectsAccumulator,
  generatePhaseRects,
  getHardMin,
  sortRects,
  checkHardMinPhase,
  getSoftMin,
  checkSoftMinPhase,
  getMax,
  generateAutoFillRects,
} from './packerUtils.js';

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
    sortRects(
      generatePhaseRects(constraints, binMap, (c) => Math.max(0, getSoftMin(c) - getHardMin(c))),
    ),
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

  return {
    validity: smCheck.validity,
    failures: [...hmCheck.failures, ...smCheck.failures],
  };
};

export const packSpace = (
  space: SpaceTemplate,
  availableBins: readonly BinSpec[],
  constraints: readonly SpaceConstraint[],
): PackingResult => {
  const dims = getEffectiveSpaceDimensions(space, getMaxBinDepth(availableBins));
  const spaceArea = dims.width * dims.depth;
  const binMap = new Map(availableBins.map((b) => [b.id, b]));

  const packer = new MaxRectsPacker(dims.width, dims.depth, 0, {
    smart: true,
    pot: false,
    square: false,
    allowRotation: false,
    tag: false,
  });

  const { validity, failures } = executePhases(constraints, binMap, packer, spaceArea);

  const placedBins = (packer.bins[0]?.rects || []).map((r) =>
    createPlacedBin(r.data.binId, createPoint3D(r.x, 0, r.y)),
  );
  const placedCounts = placedBins.reduce(
    (acc, bin) => ({ ...acc, [bin.binId]: (acc[bin.binId] || 0) + 1 }),
    {} as Record<string, number>,
  );
  const areaUtil = placedBins.reduce(
    (acc, bin) =>
      acc +
      getEffectiveFootprint(binMap.get(bin.binId)!).w *
        getEffectiveFootprint(binMap.get(bin.binId)!).l,
    0,
  );

  return createPackingResult(
    placedBins,
    createPackingMetrics(placedCounts, spaceArea > 0 ? areaUtil / spaceArea : 0, failures),
    validity,
  );
};
