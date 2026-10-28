import { describe, expect, it } from "bun:test";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import {
  ConstraintProtoSchema,
  CpModelProtoSchema,
  CpObjectiveProtoSchema,
  CpSolverResponseSchema,
  CpSolverStatus,
  IntegerVariableProtoSchema,
  IntervalConstraintProtoSchema,
  LinearConstraintProtoSchema,
  LinearExpressionProtoSchema,
  NoOverlap2DConstraintProtoSchema,
} from "./gen/ortools/sat/cp_model_pb";
import { SatParametersSchema } from "./gen/ortools/sat/sat_parameters_pb";

const buildSampleCpModel = () => {
  const xStart = create(IntegerVariableProtoSchema, {
    name: "bin_0_x",
    domain: [0n, 10000n],
  });
  const xEnd = create(IntegerVariableProtoSchema, {
    name: "bin_0_x_end",
    domain: [2000n, 12000n],
  });
  const zStart = create(IntegerVariableProtoSchema, {
    name: "bin_0_z",
    domain: [0n, 8000n],
  });
  const zEnd = create(IntegerVariableProtoSchema, {
    name: "bin_0_z_end",
    domain: [3000n, 11000n],
  });
  const presenceLit = create(IntegerVariableProtoSchema, {
    name: "bin_0_present",
    domain: [0n, 1n],
  });

  const xIntervalConstraint = create(ConstraintProtoSchema, {
    name: "bin_0_x_interval",
    enforcementLiteral: [4],
    constraint: {
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
          offset: 2000n,
        }),
        end: create(LinearExpressionProtoSchema, {
          vars: [1],
          coeffs: [1n],
          offset: 0n,
        }),
      }),
    },
  });

  const zIntervalConstraint = create(ConstraintProtoSchema, {
    name: "bin_0_z_interval",
    enforcementLiteral: [4],
    constraint: {
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
          offset: 3000n,
        }),
        end: create(LinearExpressionProtoSchema, {
          vars: [3],
          coeffs: [1n],
          offset: 0n,
        }),
      }),
    },
  });

  const noOverlap2dConstraint = create(ConstraintProtoSchema, {
    name: "space_no_overlap_2d",
    constraint: {
      case: "noOverlap2d",
      value: create(NoOverlap2DConstraintProtoSchema, {
        xIntervals: [0],
        yIntervals: [1],
      }),
    },
  });

  const linearConstraint = create(ConstraintProtoSchema, {
    name: "x_end_eq_x_plus_width",
    constraint: {
      case: "linear",
      value: create(LinearConstraintProtoSchema, {
        vars: [1, 0],
        coeffs: [1n, -1n],
        domain: [2000n, 2000n],
      }),
    },
  });

  return create(CpModelProtoSchema, {
    name: "storage_pack_test_model",
    variables: [xStart, xEnd, zStart, zEnd, presenceLit],
    constraints: [
      xIntervalConstraint,
      zIntervalConstraint,
      noOverlap2dConstraint,
      linearConstraint,
    ],
    objective: create(CpObjectiveProtoSchema, {
      vars: [4],
      coeffs: [-1n],
      offset: 0,
      scalingFactor: -1,
    }),
  });
};

describe("cp_model protobuf codegen", () => {
  it("creates, serializes, and deserializes CpModelProto variables and objective", () => {
    const model = buildSampleCpModel();
    const bytes = toBinary(CpModelProtoSchema, model);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const decoded = fromBinary(CpModelProtoSchema, bytes);
    expect(decoded.name).toBe("storage_pack_test_model");
    expect(decoded.variables).toHaveLength(5);
    expect(decoded.variables[0].name).toBe("bin_0_x");
    expect(decoded.variables[0].domain).toEqual([0n, 10000n]);
    expect(decoded.variables[4].name).toBe("bin_0_present");
    expect(decoded.variables[4].domain).toEqual([0n, 1n]);
    expect(decoded.objective).toBeDefined();
    expect(decoded.objective?.vars).toEqual([4]);
    expect(decoded.objective?.coeffs).toEqual([-1n]);
    expect(decoded.objective?.scalingFactor).toBe(-1);

    const reencoded = toBinary(CpModelProtoSchema, decoded);
    expect(reencoded).toEqual(bytes);
  });

  it("preserves interval, noOverlap2d, and linear constraints across binary round-trip", () => {
    const model = buildSampleCpModel();
    const decoded = fromBinary(
      CpModelProtoSchema,
      toBinary(CpModelProtoSchema, model),
    );

    expect(decoded.constraints).toHaveLength(4);
    expect(decoded.constraints[0].name).toBe("bin_0_x_interval");
    expect(decoded.constraints[0].enforcementLiteral).toEqual([4]);
    expect(decoded.constraints[0].constraint).toEqual(
      model.constraints[0].constraint,
    );
    expect(decoded.constraints[2].constraint).toEqual({
      case: "noOverlap2d",
      value: create(NoOverlap2DConstraintProtoSchema, {
        xIntervals: [0],
        yIntervals: [1],
      }),
    });
    expect(decoded.constraints[3].constraint).toEqual({
      case: "linear",
      value: create(LinearConstraintProtoSchema, {
        vars: [1, 0],
        coeffs: [1n, -1n],
        domain: [2000n, 2000n],
      }),
    });
  });

  it("serializes and deserializes CpSolverResponse payloads with round-trip fidelity", () => {
    const response = create(CpSolverResponseSchema, {
      status: CpSolverStatus.OPTIMAL,
      solution: [0n, 2000n, 0n, 3000n, 1n],
      objectiveValue: 1,
      bestObjectiveBound: 1,
      wallTime: 0.0125,
      solutionInfo: "optimal single-threaded solve",
    });

    const bytes = toBinary(CpSolverResponseSchema, response);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const decoded = fromBinary(CpSolverResponseSchema, bytes);
    expect(decoded.status).toBe(CpSolverStatus.OPTIMAL);
    expect(decoded.solution).toEqual([0n, 2000n, 0n, 3000n, 1n]);
    expect(decoded.objectiveValue).toBe(1);
    expect(decoded.bestObjectiveBound).toBe(1);
    expect(decoded.wallTime).toBeCloseTo(0.0125, 6);
    expect(decoded.solutionInfo).toBe("optimal single-threaded solve");
  });

  it("serializes and deserializes SatParameters payloads for single-threaded solver configuration", () => {
    const params = create(SatParametersSchema, {
      name: "wasm_single_worker",
      numSearchWorkers: 1,
      maxTimeInSeconds: 5,
      randomSeed: 42,
      logSearchProgress: false,
    });

    const bytes = toBinary(SatParametersSchema, params);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const decoded = fromBinary(SatParametersSchema, bytes);
    expect(decoded.name).toBe("wasm_single_worker");
    expect(decoded.numSearchWorkers).toBe(1);
    expect(decoded.maxTimeInSeconds).toBe(5);
    expect(decoded.randomSeed).toBe(42);
    expect(decoded.logSearchProgress).toBe(false);
  });
});
