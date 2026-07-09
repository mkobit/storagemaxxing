import { MaxRectsPacker } from "maxrects-packer";
import { PackInput } from "./PackInput";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { createPlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import {
  PackingResult,
  createPackingMetrics,
  createPackingResult,
} from "@storagemaxxing/assembly/PackingResult";
import {
  getEffectiveFootprint,
  getEffectiveSpaceDimensions,
  getMaxBinDepth,
  isFootprintEligible,
  isHeightEligible,
} from "./geometryUtils";
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
  HeightEligibility,
} from "./packerUtils";

type PackingContext = {
  readonly spaceArea: number;
  readonly heightEligibility: HeightEligibility;
};

const executePhases = (
  constraints: readonly SpaceConstraint[],
  binMap: ReadonlyMap<string, PackInput>,
  packer: MaxRectsPacker,
  context: PackingContext,
) => {
  const add = (
    rects: RectsAccumulator, // @ts-expect-error MaxRectsPacker TS definitions are missing readonly annotations
  ) => packer.addArray(Array.from(rects));


  add(sortRects(generatePhaseRects(constraints, binMap, getHardMin)));
  const hmCheck = checkHardMinPhase(
    constraints,
    packer,
    context.heightEligibility,
  );


  add(
    sortRects(
      generatePhaseRects(constraints, binMap, (c) =>
        Math.max(0, getSoftMin(c) - getHardMin(c)),
      ),
    ),
  );
  const smCheck = checkSoftMinPhase(
    constraints,
    packer,
    hmCheck.validity,
    context.heightEligibility,
  );


  add(
    sortRects(
      generatePhaseRects(constraints, binMap, (c) => {
        const max = getMax(c);
        const softMin = getSoftMin(c);
        const hardMin = getHardMin(c);
        return max !== undefined && max > softMin
          ? max - Math.max(hardMin, softMin)
          : 0;
      }),
    ),
  );


  add(generateAutoFillRects(constraints, binMap, context.spaceArea));

  return {
    validity: smCheck.validity,
    failures: [...hmCheck.failures, ...smCheck.failures],
  };
};

export const packSpace = (
  space: SpaceTemplate,
  availableBins: readonly PackInput[],
  constraints: readonly SpaceConstraint[],
): PackingResult => {
  const eligibleBins = availableBins.filter((b) =>
    isHeightEligible(b, space.h),
  );
  const ineligibleHeights = new Map(
    availableBins
      .filter((b) => !isHeightEligible(b, space.h))
      .map((b) => [b.id, getEffectiveFootprint(b).h]),
  );
  const dims = getEffectiveSpaceDimensions(
    space,
    getMaxBinDepth(eligibleBins),
  );
  const spaceArea = dims.w * dims.l;
  const packableBins = eligibleBins.filter((b) =>
    isFootprintEligible(b, dims),
  );
  const binMap = new Map(packableBins.map((b) => [b.id, b]));

  const packer = new MaxRectsPacker(dims.w, dims.l, 0, {
    smart: true,
    pot: false,
    square: false,
    allowRotation: false,
    tag: false,
  });

  const { validity, failures } = executePhases(constraints, binMap, packer, {
    spaceArea,
    heightEligibility: { ineligibleHeights, spaceHeight: space.h ?? 0 },
  });

  const placedBins = (packer.bins[0]?.rects || []).map((r) =>
    createPlacedBin(r.data.binId, createPoint3D(r.x, 0, r.y)),
  );
  const placedCounts = placedBins.reduce(
    (acc, bin) => ({ ...acc, [bin.binId]: (acc[bin.binId] || 0) + 1 }),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
    createPackingMetrics(
      placedCounts,
      spaceArea > 0 ? areaUtil / spaceArea : 0,
      failures,
    ),
    validity,
  );
};
