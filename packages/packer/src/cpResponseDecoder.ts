import {
  createConstraintFailure,
  createPackingMetrics,
  createPackingResult,
  PackingResult,
} from "@storagemaxxing/assembly/PackingResult";
import { createPlacedBin, PlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import { PackInput } from "./PackInput";
import { buildCpModel, COORD_SCALE } from "./cpModelBuilder";
import { getEffectiveFootprint } from "./geometryUtils";
import {
  CpModelProto,
  CpSolverResponse,
  CpSolverStatus,
  IntegerVariableProto,
} from "./gen/ortools/sat/cp_model_pb";

type SolverResponse = Readonly<Pick<CpSolverResponse, "status">> & {
  readonly solution: readonly bigint[];
};

const countIds = (ids: readonly string[]): Readonly<Record<string, number>> =>
  ids.reduce<Readonly<Record<string, number>>>(
    (counts, id) => ({
      ...counts,
      [id]: (Object.hasOwn(counts, id) ? counts[id] : 0) + 1,
    }),
    {},
  );

const isInDomain = (
  value: bigint | undefined,
  variable: IntegerVariableProto,
): boolean =>
  typeof value === "bigint" &&
  variable.domain.some(
    (lower, index) =>
      index % 2 === 0 && value >= lower && value <= variable.domain[index + 1],
  );

// Undefined means invalid metadata or coordinates; null means an absent item.
const decodeItem = (
  item: PackInput,
  index: number,
  assignments: ReadonlyMap<string, bigint>,
): PlacedBin | null | undefined => {
  const x = assignments.get(`bin_${index}_x`);
  const z = assignments.get(`bin_${index}_z`);
  const present = assignments.get(`bin_${index}_present`);
  if (x === undefined || z === undefined || present === undefined) {
    return undefined;
  }
  if (present === 0n) return null;
  if (present !== 1n || !isSafeCoordinate(x) || !isSafeCoordinate(z)) {
    return undefined;
  }
  return createPlacedBin(
    item.id,
    createPoint3D(Number(x) / COORD_SCALE, 0, Number(z) / COORD_SCALE),
  );
};

const isSafeCoordinate = (value: bigint): boolean =>
  value >= 0n && Number.isSafeInteger(Number(value));

const invalidResult = (items: readonly PackInput[]): PackingResult =>
  createPackingResult(
    [],
    createPackingMetrics(
      {},
      0,
      Object.entries(countIds(items.map((item) => item.id))).map(
        ([id, required]) => createConstraintFailure(id, "hardMin", required, 0),
      ),
    ),
    "invalid",
  );

/**
 * Decode assignments using the names emitted by buildCpModel.
 * Pass the exact submitted model when builder options or exclusions differ.
 * Missing optional instances are soft-minimum shortfalls; unusable responses
 * are hard failures because they provide no verified placements.
 */
export const decodeCpResponse = (
  response: SolverResponse,
  items: readonly PackInput[],
  space: SpaceTemplate,
  model: CpModelProto = buildCpModel(space, items),
): PackingResult => {
  if (
    response.status !== CpSolverStatus.OPTIMAL &&
    response.status !== CpSolverStatus.FEASIBLE
  ) {
    return invalidResult(items);
  }
  const assignments = new Map(
    model.variables.map((variable, index) => [
      variable.name,
      response.solution[index],
    ]),
  );
  if (
    response.solution.length !== model.variables.length ||
    assignments.size !== model.variables.length ||
    !model.variables.every((variable, index) =>
      isInDomain(response.solution[index], variable),
    )
  ) {
    return invalidResult(items);
  }
  const decoded = items.map((item, index) =>
    decodeItem(item, index, assignments),
  );
  if (decoded.some((placement) => placement === undefined)) {
    return invalidResult(items);
  }
  return packingResult(items, decoded, space);
};

const packingResult = (
  items: readonly PackInput[],
  decoded: readonly (PlacedBin | null | undefined)[],
  space: SpaceTemplate,
): PackingResult => {
  const placedBins = decoded.filter((placement) => placement != null);
  const placedCounts = countIds(placedBins.map((placement) => placement.binId));
  const failures = Object.entries(countIds(items.map((item) => item.id)))
    .map(([id, required]) =>
      createConstraintFailure(
        id,
        "softMin",
        required,
        Object.hasOwn(placedCounts, id) ? placedCounts[id] : 0,
      ),
    )
    .filter((failure) => failure.placed < failure.required);
  const usedArea = items.reduce((area, item, index) => {
    const footprint = getEffectiveFootprint(item);
    return decoded[index] ? area + footprint.w * footprint.l : area;
  }, 0);
  // Use the same full floor dimensions as buildCpModel, including front access.
  const spaceArea = (space.w ?? 0) * (space.l ?? 0);
  return createPackingResult(
    placedBins,
    createPackingMetrics(
      placedCounts,
      spaceArea > 0 ? usedArea / spaceArea : 0,
      failures,
    ),
    failures.length === 0 ? "valid" : "partial",
  );
};
