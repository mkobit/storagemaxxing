import { MaxRectsPacker } from "maxrects-packer";
import { BinSpec } from "@storagemaxxing/assembly/BinSpec.js";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint.js";
import {
  ConstraintFailure,
  createConstraintFailure,
  ValidityState,
} from "./types.js";
import { getEffectiveFootprint } from "./geometryUtils.js";

export type PackRect = {
  readonly width: number;
  readonly height: number;
  readonly data: { readonly binId: string };
};
export type RectsAccumulator = readonly PackRect[];

export const generateRects = (
  bin: BinSpec,
  count: number,
): RectsAccumulator => {
  if (count <= 0) return [];
  const footprint = getEffectiveFootprint(bin);
  return Array.from({ length: count }, () => ({
    width: footprint.w,
    height: footprint.l,
    data: { binId: bin.id },
  }));
};

export const generatePhaseRects = (
  constraints: readonly SpaceConstraint[],
  binMap: ReadonlyMap<string, BinSpec>,
  getCount: (c: SpaceConstraint) => number,
): RectsAccumulator =>
  constraints.reduce((acc: RectsAccumulator, c) => {
    const bin = binMap.get(c.binId);
    return bin ? [...acc, ...generateRects(bin, getCount(c))] : acc;
  }, []);

export const sortRects = (rects: RectsAccumulator): RectsAccumulator =>
  [...rects].sort((a, b) => b.width * b.height - a.width * a.height);

export const getPlacedCounts = (
  packer: MaxRectsPacker,
): ReadonlyMap<string, number> => {
  const rects = packer.bins[0]?.rects || [];
  const map = new Map<string, number>();
  // eslint-disable-next-line functional/no-loop-statements
  for (const r of rects) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    map.set(r.data.binId, (map.get(r.data.binId) || 0) + 1);
  }
  return map;
};

export const checkPhaseFailures = (
  constraints: readonly SpaceConstraint[],
  placedCounts: ReadonlyMap<string, number>,
  getRequired: (c: SpaceConstraint) => number,
  reason: "hardMin" | "softMin",
): readonly ConstraintFailure[] =>
  constraints
    .map((c) => ({
      c,
      req: getRequired(c),
      placed: placedCounts.get(c.binId) || 0,
    }))
    .filter(({ req, placed }) => placed < req)
    .map(({ c, req, placed }) =>
      createConstraintFailure(c.binId, reason, req, placed),
    );

export const getHardMin = (c: SpaceConstraint): number => {
  if (c.mode === "hard") return c.lo;
  if (c.mode === "soft") return c.hardLo ?? 0;
  return 0;
};

export const getSoftMin = (c: SpaceConstraint): number => {
  if (c.mode === "soft") return c.lo;
  if (c.mode === "hard") return c.softLo ?? c.lo;
  return 0;
};

export const getMax = (c: SpaceConstraint): number | undefined =>
  c.hi ?? undefined;

export const checkHardMinPhase = (
  constraints: readonly SpaceConstraint[],
  packer: MaxRectsPacker,
) => {
  const failures = checkPhaseFailures(
    constraints,
    getPlacedCounts(packer),
    getHardMin,
    "hardMin",
  );
  return {
    validity: failures.length > 0 ? ("invalid" as const) : ("valid" as const),
    failures,
  };
};

export const checkSoftMinPhase = (
  constraints: readonly SpaceConstraint[],
  packer: MaxRectsPacker,
  validity: ValidityState,
) => {
  if (validity !== "valid") return { validity, failures: [] };
  const failures = checkPhaseFailures(
    constraints,
    getPlacedCounts(packer),
    getSoftMin,
    "softMin",
  );
  return {
    validity: failures.length > 0 ? ("partial" as const) : ("valid" as const),
    failures,
  };
};

export const generateAutoFillRects = (
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
    return area > 0
      ? [...acc, ...generateRects(bin, Math.floor(spaceArea / area))]
      : acc;
  }, []);
};
