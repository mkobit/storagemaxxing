import { describe, expect, it } from "bun:test";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import {
  createSpaceTemplate,
  SpaceTemplate,
  SpaceTemplateId,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { inches } from "@storagemaxxing/geometry/Inches";
import { createPackInput, createPackInputBasic } from "./PackInput";
import {
  buildCpModel,
  COORD_SCALE,
  CpModelBuilderParams,
  scaleCoord,
} from "./cpModelBuilder";
import {
  CpModelProtoSchema,
  IntervalConstraintProtoSchema,
  LinearConstraintProtoSchema,
  LinearExpressionProtoSchema,
  NoOverlap2DConstraintProtoSchema,
} from "./gen/ortools/sat/cp_model_pb";

describe("cpModelBuilder", () => {
  it("exports COORD_SCALE = 1000 and scales continuous dimensions to discrete bigints", () => {
    expect(COORD_SCALE).toBe(1000);
    expect(scaleCoord(12)).toBe(12000n);
    expect(scaleCoord(3.125)).toBe(3125n);
    expect(scaleCoord(0)).toBe(0n);
  });

  it("constructs coordinate and presence variables with scaled bounds for items", () => {
    const space = createSpaceTemplate(
      "drawer-1",
      createDimensions3D(12, 10, 4),
      "top",
    );
    const items = [
      createPackInputBasic("bin-a", 3, 4, 2),
      createPackInputBasic("bin-b", 5, 2, 2),
    ];

    const model = buildCpModel(space, items);

    expect(model.variables).toHaveLength(10);

    // Item 0: w=3 (3000), l=4 (4000) in space w=12 (12000), l=10 (10000)
    expect(model.variables[0].name).toBe("bin_0_x");
    expect(model.variables[0].domain).toEqual([0n, 9000n]);
    expect(model.variables[1].name).toBe("bin_0_x_end");
    expect(model.variables[1].domain).toEqual([3000n, 12000n]);
    expect(model.variables[2].name).toBe("bin_0_z");
    expect(model.variables[2].domain).toEqual([0n, 6000n]);
    expect(model.variables[3].name).toBe("bin_0_z_end");
    expect(model.variables[3].domain).toEqual([4000n, 10000n]);
    expect(model.variables[4].name).toBe("bin_0_present");
    expect(model.variables[4].domain).toEqual([0n, 1n]);

    // Item 1: w=5 (5000), l=2 (2000) in space w=12 (12000), l=10 (10000)
    expect(model.variables[5].name).toBe("bin_1_x");
    expect(model.variables[5].domain).toEqual([0n, 7000n]);
    expect(model.variables[6].name).toBe("bin_1_x_end");
    expect(model.variables[6].domain).toEqual([5000n, 12000n]);
    expect(model.variables[7].name).toBe("bin_1_z");
    expect(model.variables[7].domain).toEqual([0n, 8000n]);
    expect(model.variables[8].name).toBe("bin_1_z_end");
    expect(model.variables[8].domain).toEqual([2000n, 10000n]);
    expect(model.variables[9].name).toBe("bin_1_present");
    expect(model.variables[9].domain).toEqual([0n, 1n]);
  });

  it("constructs interval constraints, linear size constraints, AddNoOverlap2D, and objective", () => {
    const space = createSpaceTemplate(
      "drawer-1",
      createDimensions3D(12, 10, 4),
      "top",
    );
    const items = [
      createPackInputBasic("bin-a", 3, 4, 2),
      createPackInputBasic("bin-b", 5, 2, 2),
    ];

    const model = buildCpModel(space, items);

    expect(model.constraints[0].name).toBe("bin_0_x_interval");
    expect(model.constraints[0].enforcementLiteral).toEqual([4]);
    expect(model.constraints[0].constraint).toEqual({
      case: "interval",
      value: create(IntervalConstraintProtoSchema, {
        start: create(LinearExpressionProtoSchema, {
          vars: [0],
          coeffs: [1n],
          offset: 0n,
        }),
        size: create(LinearExpressionProtoSchema, {
          vars: [],
          coeffs: [],
          offset: 3000n,
        }),
        end: create(LinearExpressionProtoSchema, {
          vars: [1],
          coeffs: [1n],
          offset: 0n,
        }),
      }),
    });

    expect(model.constraints[1].name).toBe("bin_0_z_interval");
    expect(model.constraints[1].enforcementLiteral).toEqual([4]);
    expect(model.constraints[1].constraint).toEqual({
      case: "interval",
      value: create(IntervalConstraintProtoSchema, {
        start: create(LinearExpressionProtoSchema, {
          vars: [2],
          coeffs: [1n],
          offset: 0n,
        }),
        size: create(LinearExpressionProtoSchema, {
          vars: [],
          coeffs: [],
          offset: 4000n,
        }),
        end: create(LinearExpressionProtoSchema, {
          vars: [3],
          coeffs: [1n],
          offset: 0n,
        }),
      }),
    });

    // NoOverlap2D constraint at index 4 (after 4 interval constraints)
    expect(model.constraints[4].name).toBe("space_no_overlap_2d");
    expect(model.constraints[4].constraint).toEqual({
      case: "noOverlap2d",
      value: create(NoOverlap2DConstraintProtoSchema, {
        xIntervals: [0, 2],
        yIntervals: [1, 3],
      }),
    });

    // Linear constraints linking end - start = size
    expect(model.constraints[5].constraint).toEqual({
      case: "linear",
      value: create(LinearConstraintProtoSchema, {
        vars: [1, 0],
        coeffs: [1n, -1n],
        domain: [3000n, 3000n],
      }),
    });
    expect(model.constraints[6].constraint).toEqual({
      case: "linear",
      value: create(LinearConstraintProtoSchema, {
        vars: [3, 2],
        coeffs: [1n, -1n],
        domain: [4000n, 4000n],
      }),
    });

    expect(model.objective?.vars).toEqual([4, 9]);
    expect(model.objective?.coeffs).toEqual([-1n, -1n]);
    expect(model.objective?.scalingFactor).toBe(-1);
  });

  it("applies effective footprint tolerances and handles oversized item bounds safely", () => {
    const space = createSpaceTemplate(
      "small-space",
      createDimensions3D(10, 8, 4),
      "top",
    );
    const items = [
      createPackInput({
        id: "with-tolerance",
        w: 4,
        l: 3,
        h: 2,
        toleranceW: 0.25,
        toleranceL: 0.5,
      }),
      createPackInputBasic("oversized", 15, 12, 2),
    ];

    const model = buildCpModel(space, items);

    // Item 0: effective w = 4.25 (4250n), effective l = 3.5 (3500n)
    // Space: w = 10000n, l = 8000n
    expect(model.variables[0].domain).toEqual([0n, 5750n]);
    expect(model.variables[1].domain).toEqual([4250n, 10000n]);
    expect(model.variables[2].domain).toEqual([0n, 4500n]);
    expect(model.variables[3].domain).toEqual([3500n, 8000n]);

    // Item 1: oversized (15000n > 10000n, 12000n > 8000n) falls back to [0n, scaledW] and [0n, scaledL]
    expect(model.variables[5].domain).toEqual([0n, 10000n]);
    expect(model.variables[6].domain).toEqual([0n, 10000n]);
    expect(model.variables[7].domain).toEqual([0n, 8000n]);
    expect(model.variables[8].domain).toEqual([0n, 8000n]);
  });

  it("formulates obstacle exclusion intervals for static obstacles, dividers, and backClearance", () => {
    const baseSpace = createSpaceTemplate(
      "complex-drawer",
      createDimensions3D(24, 20, 6),
      "top",
      { backClearance: 3 },
    );
    const space: SpaceTemplate = {
      ...baseSpace,
      obstacles: [
        {
          x: inches(2),
          y: inches(0),
          z: inches(4),
          w: inches(3),
          l: inches(5),
          h: inches(6),
          label: "support-post",
          permanent: true,
        },
      ],
      dividers: [
        {
          axis: "x",
          position: inches(12),
          thickness: inches(0.5),
        },
        {
          axis: "z",
          position: inches(10),
          thickness: inches(0.25),
        },
      ],
    };

    const items = [createPackInputBasic("bin-1", 4, 4, 3)];
    const model = buildCpModel(space, items);

    // 1 item (5 vars) + 4 exclusions (1 obstacle + 2 dividers + 1 reach clearance) * 4 vars = 21 variables
    expect(model.variables).toHaveLength(21);

    // Static obstacle at x=[2000, 5000], z=[4000, 9000]
    expect(model.variables[5].name).toBe("obstacle_0_x");
    expect(model.variables[5].domain).toEqual([2000n, 2000n]);
    expect(model.variables[6].name).toBe("obstacle_0_x_end");
    expect(model.variables[6].domain).toEqual([5000n, 5000n]);
    expect(model.variables[7].name).toBe("obstacle_0_z");
    expect(model.variables[7].domain).toEqual([4000n, 4000n]);
    expect(model.variables[8].name).toBe("obstacle_0_z_end");
    expect(model.variables[8].domain).toEqual([9000n, 9000n]);

    // Divider 0 (axis 'x'): x=[12000, 12500], z=[0, 20000]
    expect(model.variables[9].name).toBe("divider_0_x");
    expect(model.variables[9].domain).toEqual([12000n, 12000n]);
    expect(model.variables[10].name).toBe("divider_0_x_end");
    expect(model.variables[10].domain).toEqual([12500n, 12500n]);
    expect(model.variables[11].name).toBe("divider_0_z");
    expect(model.variables[11].domain).toEqual([0n, 0n]);
    expect(model.variables[12].name).toBe("divider_0_z_end");
    expect(model.variables[12].domain).toEqual([20000n, 20000n]);

    // Divider 1 (axis 'z'): x=[0, 24000], z=[10000, 10250]
    expect(model.variables[13].name).toBe("divider_1_x");
    expect(model.variables[13].domain).toEqual([0n, 0n]);
    expect(model.variables[14].name).toBe("divider_1_x_end");
    expect(model.variables[14].domain).toEqual([24000n, 24000n]);
    expect(model.variables[15].name).toBe("divider_1_z");
    expect(model.variables[15].domain).toEqual([10000n, 10000n]);
    expect(model.variables[16].name).toBe("divider_1_z_end");
    expect(model.variables[16].domain).toEqual([10250n, 10250n]);

    // Reach clearance (backClearance = 3 on l = 20): x=[0, 24000], z=[17000, 20000]
    expect(model.variables[17].name).toBe("reach_clearance_x");
    expect(model.variables[17].domain).toEqual([0n, 0n]);
    expect(model.variables[18].name).toBe("reach_clearance_x_end");
    expect(model.variables[18].domain).toEqual([24000n, 24000n]);
    expect(model.variables[19].name).toBe("reach_clearance_z");
    expect(model.variables[19].domain).toEqual([17000n, 17000n]);
    expect(model.variables[20].name).toBe("reach_clearance_z_end");
    expect(model.variables[20].domain).toEqual([20000n, 20000n]);

    // NoOverlap2D is at index 10 (after 5 * 2 = 10 interval constraints)
    expect(model.constraints[10].constraint).toEqual({
      case: "noOverlap2d",
      value: create(NoOverlap2DConstraintProtoSchema, {
        xIntervals: [0, 2, 4, 6, 8],
        yIntervals: [1, 3, 5, 7, 9],
      }),
    });
  });

  it("supports area objective mode, mandatory items, and binary round-trip serialization", () => {
    const space: SpaceTemplate = {
      id: "undef-dims" as SpaceTemplateId,
      name: "custom-space",
      type: "drawer",
      accessFace: "top",
      w: 10,
      l: 10,
      h: 4,
      backClearance: 15,
      packingModel: "2d",
      installationConstraints: [],
      gridResolution: 0.5,
    };
    const items = [createPackInputBasic("bin-area", 2, 3, 2)];
    const params: CpModelBuilderParams = {
      modelName: "area_test_model",
      optionalItems: false,
      objectiveMode: "area",
    };

    const model = buildCpModel(space, items, params);
    expect(model.name).toBe("area_test_model");
    expect(model.variables[4].domain).toEqual([1n, 1n]);
    expect(model.constraints[0].enforcementLiteral).toEqual([]);
    expect(model.objective?.coeffs).toEqual([-6000000n]);

    const bytes = toBinary(CpModelProtoSchema, model);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const decoded = fromBinary(CpModelProtoSchema, bytes);
    expect(decoded.name).toBe("area_test_model");
    expect(decoded.variables).toHaveLength(model.variables.length);
    expect(decoded.constraints).toHaveLength(model.constraints.length);
    expect(decoded.objective?.coeffs).toEqual([-6000000n]);
  });
});
