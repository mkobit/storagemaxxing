import { create } from "@bufbuild/protobuf";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { PackInput } from "./PackInput";
import { getEffectiveFootprint } from "./geometryUtils";
import {
  ConstraintProto,
  ConstraintProtoSchema,
  CpModelProto,
  CpModelProtoSchema,
  CpObjectiveProto,
  CpObjectiveProtoSchema,
  IntegerVariableProto,
  IntegerVariableProtoSchema,
  IntervalConstraintProtoSchema,
  LinearConstraintProtoSchema,
  LinearExpressionProtoSchema,
  NoOverlap2DConstraintProtoSchema,
} from "./gen/ortools/sat/cp_model_pb";

export const COORD_SCALE = 1000;

export type CpModelObjectiveMode = "count" | "area";

export type CpModelBuilderParams = {
  readonly modelName?: string;
  readonly optionalItems?: boolean;
  readonly objectiveMode?: CpModelObjectiveMode;
};

type ScaledExclusionRegion = {
  readonly namePrefix: string;
  readonly startX: bigint;
  readonly sizeX: bigint;
  readonly endX: bigint;
  readonly startZ: bigint;
  readonly sizeZ: bigint;
  readonly endZ: bigint;
};

type IntervalSpec = {
  readonly name: string;
  readonly startVarIdx: number;
  readonly endVarIdx: number;
  readonly scaledSize: bigint;
  readonly enforcementLiteral: readonly number[];
};

type BoxModelElements = {
  readonly variables: readonly IntegerVariableProto[];
  readonly xInterval: ConstraintProto;
  readonly zInterval: ConstraintProto;
  readonly linearConstraints: readonly ConstraintProto[];
};

type ResolvedBuilderConfig = {
  readonly modelName: string;
  readonly isOptional: boolean;
  readonly objectiveMode: CpModelObjectiveMode;
  readonly scaledW: bigint;
  readonly scaledL: bigint;
};

export const scaleCoord = (dimension: number): bigint =>
  BigInt(Math.round(dimension * COORD_SCALE));

const computeStartDomain = (
  scaledSpace: bigint,
  scaledItem: bigint,
): readonly [bigint, bigint] =>
  scaledItem > scaledSpace ? [0n, scaledSpace] : [0n, scaledSpace - scaledItem];

const computeEndDomain = (
  scaledSpace: bigint,
  scaledItem: bigint,
): readonly [bigint, bigint] =>
  scaledItem > scaledSpace ? [0n, scaledSpace] : [scaledItem, scaledSpace];

const createIntervalConstraint = (spec: IntervalSpec): ConstraintProto =>
  create(ConstraintProtoSchema, {
    name: spec.name,
    enforcementLiteral: [...spec.enforcementLiteral],
    constraint: {
      case: "interval",
      value: create(IntervalConstraintProtoSchema, {
        start: create(LinearExpressionProtoSchema, {
          vars: [spec.startVarIdx],
          coeffs: [1n],
          offset: 0n,
        }),
        size: create(LinearExpressionProtoSchema, {
          vars: [],
          coeffs: [],
          offset: spec.scaledSize,
        }),
        end: create(LinearExpressionProtoSchema, {
          vars: [spec.endVarIdx],
          coeffs: [1n],
          offset: 0n,
        }),
      }),
    },
  });

const createSizeLinearConstraint = (spec: IntervalSpec): ConstraintProto =>
  create(ConstraintProtoSchema, {
    name: spec.name,
    enforcementLiteral: [...spec.enforcementLiteral],
    constraint: {
      case: "linear",
      value: create(LinearConstraintProtoSchema, {
        vars: [spec.endVarIdx, spec.startVarIdx],
        coeffs: [1n, -1n],
        domain: [spec.scaledSize, spec.scaledSize],
      }),
    },
  });

const buildItemElements = (
  item: PackInput,
  itemIndex: number,
  config: ResolvedBuilderConfig,
): BoxModelElements => {
  const footprint = getEffectiveFootprint(item);
  const scaledItemW = scaleCoord(footprint.w);
  const scaledItemL = scaleCoord(footprint.l);
  const baseVarIdx = itemIndex * 5;
  const xStartIdx = baseVarIdx;
  const xEndIdx = baseVarIdx + 1;
  const zStartIdx = baseVarIdx + 2;
  const zEndIdx = baseVarIdx + 3;
  const presenceIdx = baseVarIdx + 4;
  const enforcementLiteral: readonly number[] = config.isOptional
    ? [presenceIdx]
    : [];
  const presenceDomain: readonly [bigint, bigint] = config.isOptional
    ? [0n, 1n]
    : [1n, 1n];

  const variables: readonly IntegerVariableProto[] = [
    create(IntegerVariableProtoSchema, {
      name: `bin_${itemIndex}_x`,
      domain: [...computeStartDomain(config.scaledW, scaledItemW)],
    }),
    create(IntegerVariableProtoSchema, {
      name: `bin_${itemIndex}_x_end`,
      domain: [...computeEndDomain(config.scaledW, scaledItemW)],
    }),
    create(IntegerVariableProtoSchema, {
      name: `bin_${itemIndex}_z`,
      domain: [...computeStartDomain(config.scaledL, scaledItemL)],
    }),
    create(IntegerVariableProtoSchema, {
      name: `bin_${itemIndex}_z_end`,
      domain: [...computeEndDomain(config.scaledL, scaledItemL)],
    }),
    create(IntegerVariableProtoSchema, {
      name: `bin_${itemIndex}_present`,
      domain: [...presenceDomain],
    }),
  ];

  return {
    variables,
    xInterval: createIntervalConstraint({
      name: `bin_${itemIndex}_x_interval`,
      startVarIdx: xStartIdx,
      endVarIdx: xEndIdx,
      scaledSize: scaledItemW,
      enforcementLiteral,
    }),
    zInterval: createIntervalConstraint({
      name: `bin_${itemIndex}_z_interval`,
      startVarIdx: zStartIdx,
      endVarIdx: zEndIdx,
      scaledSize: scaledItemL,
      enforcementLiteral,
    }),
    linearConstraints: [
      createSizeLinearConstraint({
        name: `bin_${itemIndex}_x_size`,
        startVarIdx: xStartIdx,
        endVarIdx: xEndIdx,
        scaledSize: scaledItemW,
        enforcementLiteral,
      }),
      createSizeLinearConstraint({
        name: `bin_${itemIndex}_z_size`,
        startVarIdx: zStartIdx,
        endVarIdx: zEndIdx,
        scaledSize: scaledItemL,
        enforcementLiteral,
      }),
    ],
  };
};

const collectStaticObstacles = (
  space: SpaceTemplate,
): readonly ScaledExclusionRegion[] =>
  (space.obstacles ?? []).map((obs, idx) => {
    const startX = scaleCoord(obs.x);
    const sizeX = scaleCoord(obs.w);
    const startZ = scaleCoord(obs.z);
    const sizeZ = scaleCoord(obs.l);
    return {
      namePrefix: `obstacle_${idx}`,
      startX,
      sizeX,
      endX: startX + sizeX,
      startZ,
      sizeZ,
      endZ: startZ + sizeZ,
    };
  });

const collectDividerRegions = (
  space: SpaceTemplate,
  scaledW: bigint,
  scaledL: bigint,
): readonly ScaledExclusionRegion[] =>
  (space.dividers ?? []).map((divider, idx) => {
    if (divider.axis === "x") {
      const startX = scaleCoord(divider.position);
      const sizeX = scaleCoord(divider.thickness);
      return {
        namePrefix: `divider_${idx}`,
        startX,
        sizeX,
        endX: startX + sizeX,
        startZ: 0n,
        sizeZ: scaledL,
        endZ: scaledL,
      };
    }
    const startZ = scaleCoord(divider.position);
    const sizeZ = scaleCoord(divider.thickness);
    return {
      namePrefix: `divider_${idx}`,
      startX: 0n,
      sizeX: scaledW,
      endX: scaledW,
      startZ,
      sizeZ,
      endZ: startZ + sizeZ,
    };
  });

const collectClearanceRegions = (
  space: SpaceTemplate,
  scaledW: bigint,
  scaledL: bigint,
): readonly ScaledExclusionRegion[] => {
  const backClearance = space.backClearance;
  if (backClearance === undefined || backClearance <= 0) {
    return [];
  }
  const scaledClearance = scaleCoord(backClearance);
  const startZ = scaledClearance > scaledL ? 0n : scaledL - scaledClearance;
  const sizeZ = scaledL - startZ;
  return [
    {
      namePrefix: "reach_clearance",
      startX: 0n,
      sizeX: scaledW,
      endX: scaledW,
      startZ,
      sizeZ,
      endZ: scaledL,
    },
  ];
};

const collectExclusionRegions = (
  space: SpaceTemplate,
  scaledW: bigint,
  scaledL: bigint,
): readonly ScaledExclusionRegion[] => [
  ...collectStaticObstacles(space),
  ...collectDividerRegions(space, scaledW, scaledL),
  ...collectClearanceRegions(space, scaledW, scaledL),
];

const buildExclusionElements = (
  region: ScaledExclusionRegion,
  baseVarIdx: number,
): BoxModelElements => {
  const xStartIdx = baseVarIdx;
  const xEndIdx = baseVarIdx + 1;
  const zStartIdx = baseVarIdx + 2;
  const zEndIdx = baseVarIdx + 3;

  const variables: readonly IntegerVariableProto[] = [
    create(IntegerVariableProtoSchema, {
      name: `${region.namePrefix}_x`,
      domain: [region.startX, region.startX],
    }),
    create(IntegerVariableProtoSchema, {
      name: `${region.namePrefix}_x_end`,
      domain: [region.endX, region.endX],
    }),
    create(IntegerVariableProtoSchema, {
      name: `${region.namePrefix}_z`,
      domain: [region.startZ, region.startZ],
    }),
    create(IntegerVariableProtoSchema, {
      name: `${region.namePrefix}_z_end`,
      domain: [region.endZ, region.endZ],
    }),
  ];

  return {
    variables,
    xInterval: createIntervalConstraint({
      name: `${region.namePrefix}_x_interval`,
      startVarIdx: xStartIdx,
      endVarIdx: xEndIdx,
      scaledSize: region.sizeX,
      enforcementLiteral: [],
    }),
    zInterval: createIntervalConstraint({
      name: `${region.namePrefix}_z_interval`,
      startVarIdx: zStartIdx,
      endVarIdx: zEndIdx,
      scaledSize: region.sizeZ,
      enforcementLiteral: [],
    }),
    linearConstraints: [
      createSizeLinearConstraint({
        name: `${region.namePrefix}_x_size`,
        startVarIdx: xStartIdx,
        endVarIdx: xEndIdx,
        scaledSize: region.sizeX,
        enforcementLiteral: [],
      }),
      createSizeLinearConstraint({
        name: `${region.namePrefix}_z_size`,
        startVarIdx: zStartIdx,
        endVarIdx: zEndIdx,
        scaledSize: region.sizeZ,
        enforcementLiteral: [],
      }),
    ],
  };
};

const buildObjective = (
  items: readonly PackInput[],
  objectiveMode: CpModelObjectiveMode,
): CpObjectiveProto => {
  const vars = items.map((_, idx) => idx * 5 + 4);
  const coeffs = items.map((item) => {
    if (objectiveMode === "area") {
      const footprint = getEffectiveFootprint(item);
      const area = scaleCoord(footprint.w) * scaleCoord(footprint.l);
      return area > 0n ? -area : -1n;
    }
    return -1n;
  });

  return create(CpObjectiveProtoSchema, {
    vars,
    coeffs,
    offset: 0,
    scalingFactor: -1,
  });
};

const resolveSpaceDimensions = (
  space: SpaceTemplate,
): { readonly scaledW: bigint; readonly scaledL: bigint } => ({
  scaledW: scaleCoord(space.w ?? 0),
  scaledL: scaleCoord(space.l ?? 0),
});

const resolveBuilderConfig = (
  space: SpaceTemplate,
  params?: CpModelBuilderParams,
): ResolvedBuilderConfig => {
  const dims = resolveSpaceDimensions(space);
  return {
    modelName: params?.modelName ?? space.name,
    isOptional: params?.optionalItems ?? true,
    objectiveMode: params?.objectiveMode ?? "count",
    scaledW: dims.scaledW,
    scaledL: dims.scaledL,
  };
};

export const buildCpModel = (
  space: SpaceTemplate,
  items: readonly PackInput[],
  params?: CpModelBuilderParams,
): CpModelProto => {
  const config = resolveBuilderConfig(space, params);
  const itemBoxes = items.map((item, idx) =>
    buildItemElements(item, idx, config),
  );
  const exclusionRegions = collectExclusionRegions(
    space,
    config.scaledW,
    config.scaledL,
  );
  const itemVarCount = items.length * 5;
  const exclusionBoxes = exclusionRegions.map((region, idx) =>
    buildExclusionElements(region, itemVarCount + idx * 4),
  );
  const allBoxes: readonly BoxModelElements[] = [
    ...itemBoxes,
    ...exclusionBoxes,
  ];

  const intervalConstraints = allBoxes.flatMap((box) => [
    box.xInterval,
    box.zInterval,
  ]);
  const linearConstraints = allBoxes.flatMap((box) => box.linearConstraints);
  const noOverlap2dConstraint = create(ConstraintProtoSchema, {
    name: "space_no_overlap_2d",
    constraint: {
      case: "noOverlap2d",
      value: create(NoOverlap2DConstraintProtoSchema, {
        xIntervals: allBoxes.map((_, idx) => idx * 2),
        yIntervals: allBoxes.map((_, idx) => idx * 2 + 1),
      }),
    },
  });

  return create(CpModelProtoSchema, {
    name: config.modelName,
    variables: allBoxes.flatMap((box) => box.variables),
    constraints: [
      ...intervalConstraints,
      noOverlap2dConstraint,
      ...linearConstraints,
    ],
    objective: buildObjective(items, config.objectiveMode),
  });
};
