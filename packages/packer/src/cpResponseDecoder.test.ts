import { describe, expect, it } from "bun:test";
import { create, fromBinary } from "@bufbuild/protobuf";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import { createPackInput, createPackInputBasic } from "./PackInput";
import { buildCpModel } from "./cpModelBuilder";
import { decodeCpResponse } from "./cpResponseDecoder";
import {
  CpSolverResponseSchema,
  CpSolverStatus,
} from "./gen/ortools/sat/cp_model_pb";

const space = createSpaceTemplate(
  "drawer",
  createDimensions3D(12, 10, 4),
  "top",
);
const bin = createPackInputBasic("bin-a", 2, 3, 1);
const solution = [1250n, 3250n, 4500n, 7500n, 1n];
const response = (
  values: readonly bigint[] = solution,
  status = CpSolverStatus.OPTIMAL,
) => create(CpSolverResponseSchema, { status, solution: [...values] });

describe("decodeCpResponse", () => {
  it.each([CpSolverStatus.OPTIMAL, CpSolverStatus.FEASIBLE])(
    "decodes status %s into canonical floor coordinates and area metrics",
    (status) => {
      const result = decodeCpResponse(response(solution, status), [bin], space);

      expect(result).toEqual({
        placedBins: [{ binId: bin.id, origin: createPoint3D(1.25, 0, 4.5) }],
        metrics: {
          placedCounts: { "bin-a": 1 },
          areaUtilization: 6 / 120,
          failures: [],
        },
        validity: "valid",
      });
      expect(result.placedBins[0].origin).toBeInstanceOf(Float32Array);
    },
  );

  it("counts repeated bin IDs, skips absent items, and reports the shortfall once per ID", () => {
    const items = [bin, bin, bin, createPackInputBasic("bin-b", 1, 1, 1)];
    const result = decodeCpResponse(
      response([
        ...solution,
        0n,
        2000n,
        0n,
        3000n,
        0n,
        0n,
        2000n,
        0n,
        3000n,
        0n,
        8000n,
        9000n,
        0n,
        1000n,
        1n,
      ]),
      items,
      space,
    );

    expect(result.placedBins.map((placed) => placed.binId)).toEqual([
      "bin-a",
      "bin-b",
    ]);
    expect(result.metrics).toEqual({
      placedCounts: { "bin-a": 1, "bin-b": 1 },
      areaUtilization: 7 / 120,
      failures: [{ binId: "bin-a", reason: "softMin", required: 3, placed: 1 }],
    });
    expect(result.validity).toBe("partial");
  });

  it("uses effective footprints for area utilization", () => {
    const item = createPackInput({
      ...bin,
      toleranceW: 0.25,
      toleranceL: 0.5,
    });
    const result = decodeCpResponse(
      response([0n, 2250n, 0n, 3500n, 1n]),
      [item],
      space,
    );

    expect(result.metrics.areaUtilization).toBe((2.25 * 3.5) / 120);
  });

  it("uses the full modeled floor area for front-access spaces", () => {
    const result = decodeCpResponse(response(), [bin], {
      ...space,
      accessFace: "front",
    });

    expect(result.metrics.areaUtilization).toBe(6 / 120);
  });

  it.each([
    CpSolverStatus.INFEASIBLE,
    CpSolverStatus.MODEL_INVALID,
    CpSolverStatus.UNKNOWN,
  ])("rejects status %s even when assignments are supplied", (status) => {
    const result = decodeCpResponse(
      response(solution, status),
      [bin, bin],
      space,
    );

    expect(result).toEqual({
      placedBins: [],
      metrics: {
        placedCounts: {},
        areaUtilization: 0,
        failures: [
          { binId: bin.id, reason: "hardMin", required: 2, placed: 0 },
        ],
      },
      validity: "invalid",
    });
  });

  it("rejects an unrecognized protobuf status without throwing", () => {
    const result = decodeCpResponse(
      fromBinary(CpSolverResponseSchema, new Uint8Array([0x08, 99])),
      [bin],
      space,
    );

    expect(result.validity).toBe("invalid");
    expect(result.placedBins).toEqual([]);
    expect(result.metrics.failures).toHaveLength(1);
  });

  it.each([
    [],
    [1250n, 3250n, 4500n, 7500n],
    [...solution, 0n],
    [-1n, 1999n, 4500n, 7500n, 1n],
    [11000n, 13000n, 4500n, 7500n, 1n],
    [1250n, 3250n, 4500n, 7500n, 2n],
  ])(
    "rejects malformed or out-of-domain assignments as a whole",
    (...values) => {
      const result = decodeCpResponse(response(values), [bin], space);

      expect(result.validity).toBe("invalid");
      expect(result.placedBins).toEqual([]);
      expect(result.metrics.areaUtilization).toBe(0);
      expect(result.metrics.failures).toEqual([
        { binId: bin.id, reason: "hardMin", required: 1, placed: 0 },
      ]);
    },
  );

  it("does not return a partial placement from a truncated solution", () => {
    const result = decodeCpResponse(response(solution), [bin, bin], space);

    expect(result.validity).toBe("invalid");
    expect(result.placedBins).toEqual([]);
  });

  it("uses model variable names rather than fixed offsets and ignores exclusion placements", () => {
    const model = buildCpModel({ ...space, backClearance: 1 }, [bin]);
    const values = [...solution, 0n, 12000n, 9000n, 10000n];
    const reorderedModel = {
      ...model,
      variables: [...model.variables].reverse(),
    };
    const result = decodeCpResponse(
      response([...values].reverse()),
      [bin],
      space,
      reorderedModel,
    );

    expect(result.validity).toBe("valid");
    expect(result.placedBins).toEqual([
      { binId: bin.id, origin: createPoint3D(1.25, 0, 4.5) },
    ]);
    expect(result.metrics.placedCounts).toEqual({ "bin-a": 1 });
  });

  it("rejects missing and duplicate item variable metadata", () => {
    const model = buildCpModel(space, [bin]);
    const missingModel = {
      ...model,
      variables: model.variables.map((variable) => ({ ...variable, name: "" })),
    };
    const duplicateModel = {
      ...model,
      variables: [...model.variables, model.variables[0]],
    };

    expect(
      decodeCpResponse(response(), [bin], space, missingModel).validity,
    ).toBe("invalid");
    expect(
      decodeCpResponse(
        response([...solution, 1250n]),
        [bin],
        space,
        duplicateModel,
      ).validity,
    ).toBe("invalid");
  });

  it("rejects coordinates that cannot be converted to safe integer numbers", () => {
    const hugeSpace = { ...space, w: 1e14 };
    const result = decodeCpResponse(
      response([9007199254740993n, 9007199254742993n, 0n, 3000n, 1n]),
      [bin],
      hugeSpace,
    );

    expect(result.validity).toBe("invalid");
    expect(result.placedBins).toEqual([]);
  });

  it("decodes mandatory items and rejects an absent mandatory item", () => {
    const model = buildCpModel(space, [bin], { optionalItems: false });

    expect(decodeCpResponse(response(), [bin], space, model).validity).toBe(
      "valid",
    );
    expect(
      decodeCpResponse(
        response([0n, 2000n, 0n, 3000n, 0n]),
        [bin],
        space,
        model,
      ),
    ).toEqual({
      placedBins: [],
      metrics: {
        placedCounts: {},
        areaUtilization: 0,
        failures: [
          { binId: bin.id, reason: "hardMin", required: 1, placed: 0 },
        ],
      },
      validity: "invalid",
    });
  });

  it("returns a partial result when no optional items are placed", () => {
    const result = decodeCpResponse(
      response([0n, 2000n, 0n, 3000n, 0n]),
      [bin],
      space,
    );

    expect(result.validity).toBe("partial");
    expect(result.metrics.placedCounts).toEqual({});
    expect(result.metrics.failures).toEqual([
      { binId: bin.id, reason: "softMin", required: 1, placed: 0 },
    ]);
  });

  it("handles empty items and zero or unspecified floor area without NaN", () => {
    expect(decodeCpResponse(response([]), [], space)).toEqual({
      placedBins: [],
      metrics: { placedCounts: {}, areaUtilization: 0, failures: [] },
      validity: "valid",
    });
    const zeroBin = createPackInputBasic("zero", 0, 0, 0);
    const zeroSpace = { ...space, w: undefined, l: undefined };

    expect(
      decodeCpResponse(response([0n, 0n, 0n, 0n, 1n]), [zeroBin], zeroSpace)
        .metrics.areaUtilization,
    ).toBe(0);
    expect(
      decodeCpResponse(response([], CpSolverStatus.INFEASIBLE), [], space)
        .validity,
    ).toBe("invalid");
  });

  it("counts IDs that match object prototype property names", () => {
    const items = ["constructor", "__proto__", "toString"].map((id) => ({
      ...bin,
      id,
    }));
    const result = decodeCpResponse(
      response(items.flatMap(() => solution)),
      items,
      space,
    );

    expect(Object.entries(result.metrics.placedCounts)).toEqual([
      ["constructor", 1],
      ["__proto__", 1],
      ["toString", 1],
    ]);
  });

  it("is deterministic and does not change inputs", () => {
    const items = Object.freeze([Object.freeze(bin)]);
    const solverResponse = Object.freeze({
      ...response(),
      solution: Object.freeze([...solution]),
    });
    const model = buildCpModel(space, items);
    const before = structuredClone(model);

    const first = decodeCpResponse(solverResponse, items, space, model);

    expect(decodeCpResponse(solverResponse, items, space, model)).toEqual(
      first,
    );
    expect(model).toEqual(before);
    expect(solverResponse.solution).toEqual(solution);
  });
});
