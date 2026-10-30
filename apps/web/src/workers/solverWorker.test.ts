import { describe, expect, spyOn, test } from "bun:test";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { createPackInputBasic } from "@storagemaxxing/packer/PackInput";
import {
  CpModelProtoSchema,
  CpSolverResponseSchema,
  CpSolverStatus,
} from "@storagemaxxing/packer/gen/ortools/sat/cp_model_pb";
import { SatParametersSchema } from "@storagemaxxing/packer/gen/ortools/sat/sat_parameters_pb";
import type { WasmLoadResult } from "@storagemaxxing/packer/wasmLoader";
import {
  createSolverWorkerHandler,
  type SolverWorkerRequest,
  type SolverWorkerResponse,
} from "./solverWorker";

const request: SolverWorkerRequest = {
  type: "SOLVE_SPACE",
  requestId: "d4544e4e-dc9a-4e00-971e-269e03849b9f",
  spaceTemplate: createSpaceTemplate(
    "drawer",
    createDimensions3D(12, 10, 4),
    "top",
  ),
  items: [createPackInputBasic("bin-a", 2, 3, 1)],
};

// This native export double tests the real loader bridge without a solver binary.
const nativeFixture = (
  status = CpSolverStatus.OPTIMAL,
  mode: "normal" | "trap" | "corrupt" | "badLength" | "null" | "oom" = "normal",
) => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const allocations = new Set<number>();
  const responses = new Set<number>();
  const inputs = new Map<string, Uint8Array>();
  const counters = new Int32Array([64, 0, 0]);
  const bytes =
    mode === "corrupt"
      ? new Uint8Array([0xff])
      : toBinary(
          CpSolverResponseSchema,
          create(CpSolverResponseSchema, {
            status,
            solution: [1250n, 3250n, 4500n, 7500n, 1n],
            wallTime: 0.125,
          }),
        );
  const exports = {
    memory,
    malloc: (size: number): number => {
      if (mode === "oom" && size > 4) return 0;
      const pointer = Atomics.add(counters, 0, size + 4);
      // eslint-disable-next-line functional/immutable-data -- Track native allocation ownership.
      allocations.add(pointer);
      return pointer;
    },
    free: (pointer: number): void => {
      expect(allocations.has(pointer)).toBe(true);
      // eslint-disable-next-line functional/immutable-data -- Track native allocation release.
      allocations.delete(pointer);
      Atomics.add(counters, 1, 1);
    },
    FreeBuffer: (pointer: number): void => {
      expect(responses.has(pointer)).toBe(true);
      // eslint-disable-next-line functional/immutable-data -- Track native response release.
      responses.delete(pointer);
      new Uint8Array(memory.buffer, pointer, bytes.length).fill(0);
      Atomics.add(counters, 2, 1);
    },
    SolveProto: (
      ...args: readonly [number, number, number, number, number]
    ): number => {
      const [modelPtr, modelLen, paramsPtr, paramsLen, outLenPtr] = args;
      // eslint-disable-next-line functional/immutable-data -- Capture bytes at the native ABI boundary.
      inputs.set(
        "model",
        new Uint8Array(memory.buffer, modelPtr, modelLen).slice(),
      );
      // eslint-disable-next-line functional/immutable-data -- Capture bytes at the native ABI boundary.
      inputs.set(
        "parameters",
        new Uint8Array(memory.buffer, paramsPtr, paramsLen).slice(),
      );
      if (mode === "trap") throw new WebAssembly.RuntimeError("Solver trap");
      if (mode === "null") return 0;
      const pointer = Atomics.add(counters, 0, bytes.length + 4);
      // eslint-disable-next-line functional/immutable-data -- Track native response ownership.
      responses.add(pointer);
      new Uint8Array(memory.buffer, pointer, bytes.length).set(bytes);
      new DataView(memory.buffer).setInt32(
        outLenPtr,
        mode === "badLength" ? memory.buffer.byteLength : bytes.length,
        true,
      );
      return pointer;
    },
  };
  const emptyModule = new WebAssembly.Module(
    new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
  );
  const load = (): Promise<WasmLoadResult> =>
    Promise.resolve({
      ok: true,
      module: {
        ...exports,
        exports,
        wasmModule: emptyModule,
        instance: new WebAssembly.Instance(emptyModule),
        solveProto: () => {
          throw new Error("Use the cleanup-safe native bridge");
        },
      },
    });
  return { load, allocations, responses, inputs, counters };
};

const receiver = () => {
  const messages = new Map<number, SolverWorkerResponse>();
  const post = (
    response: SolverWorkerResponse,
    transfer: readonly ArrayBuffer[],
  ): void => {
    // eslint-disable-next-line functional/immutable-data -- Capture the receiver side of an actual buffer transfer.
    messages.set(
      messages.size,
      structuredClone(response, { transfer: [...transfer] }),
    );
    transfer.forEach((buffer) => expect(buffer.byteLength).toBe(0));
  };
  return { messages, post };
};

describe("solver worker", () => {
  test("loads the binary through the existing loader and reports missing exports", async () => {
    const fetchBinary = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])),
    );
    try {
      const output = receiver();
      await createSolverWorkerHandler(output.post)(request);
      expect(output.messages.get(0)).toMatchObject({
        requestId: request.requestId,
        status: "MODEL_INVALID",
        errorCode: "MISSING_EXPORTS",
      });
      expect(fetchBinary).toHaveBeenCalledWith("/ortools-sat.wasm");
    } finally {
      fetchBinary.mockRestore();
    }
  });

  test("reports a missing solver binary as a structured load failure", async () => {
    const fetchBinary = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );
    try {
      const output = receiver();
      await createSolverWorkerHandler(output.post)(request);
      expect(output.messages.get(0)).toMatchObject({
        status: "MODEL_INVALID",
        errorCode: "LOAD_FAILED",
      });
      expect(output.messages.get(0)?.errorMessage).toContain("404");
    } finally {
      fetchBinary.mockRestore();
    }
  });

  test("builds a protobuf model and returns canonical placements with owned transferable bytes", async () => {
    const native = nativeFixture();
    const output = receiver();
    const handle = createSolverWorkerHandler(output.post, native.load);

    await handle({
      ...request,
      parameters: {
        maxTimeInSeconds: 0.25,
        numWorkers: 1,
        randomSeed: 7,
        logSearchProgress: true,
      },
    });

    const result = output.messages.get(0);
    expect(result).toMatchObject({
      type: "SOLVE_SPACE_RESULT",
      requestId: request.requestId,
      status: "OPTIMAL",
      packingResult: {
        placedBins: [
          { binId: "bin-a", origin: new Float32Array([1.25, 0, 4.5]) },
        ],
        metrics: {
          placedCounts: { "bin-a": 1 },
          areaUtilization: 0.05,
          failures: [],
        },
        validity: "valid",
      },
    });
    expect(result?.wallTimeMs).toBeGreaterThanOrEqual(0);
    expect(result?.responseBuffer).toBeInstanceOf(ArrayBuffer);
    expect(
      fromBinary(
        CpSolverResponseSchema,
        new Uint8Array(result!.responseBuffer!),
      ).solution,
    ).toEqual([1250n, 3250n, 4500n, 7500n, 1n]);
    const model = fromBinary(CpModelProtoSchema, native.inputs.get("model")!);
    expect(model.variables[0]).toMatchObject({
      name: "bin_0_x",
      domain: [0n, 10000n],
    });
    expect(
      model.constraints.some(
        (constraint) => constraint.constraint.case === "noOverlap2d",
      ),
    ).toBe(true);
    expect(
      fromBinary(SatParametersSchema, native.inputs.get("parameters")!),
    ).toMatchObject({
      numSearchWorkers: 1,
      maxTimeInSeconds: 0.25,
      randomSeed: 7,
      logSearchProgress: true,
    });
    expect(native.allocations.size).toBe(0);
    expect(native.responses.size).toBe(0);
    expect(native.counters[1]).toBe(3);
    expect(native.counters[2]).toBe(1);
  });

  test("shares one module across requests and applies safe single-threaded defaults", async () => {
    const native = nativeFixture();
    const output = receiver();
    const loads = new Int32Array(1);
    const handle = createSolverWorkerHandler(output.post, () => {
      Atomics.add(loads, 0, 1);
      return native.load();
    });
    await Promise.all([
      handle(request),
      handle({ ...request, requestId: "67c4defc-93ec-4a9c-91ac-1315b5b37ca2" }),
    ]);

    expect(loads[0]).toBe(1);
    expect(output.messages.size).toBe(2);
    expect(output.messages.get(1)?.requestId).toBe(
      "67c4defc-93ec-4a9c-91ac-1315b5b37ca2",
    );
    expect(
      fromBinary(SatParametersSchema, native.inputs.get("parameters")!),
    ).toMatchObject({
      maxTimeInSeconds: 5,
      numSearchWorkers: 1,
      randomSeed: 42,
      logSearchProgress: false,
    });
    expect(native.allocations.size).toBe(0);
    expect(native.responses.size).toBe(0);
    expect(native.counters[2]).toBe(2);
  });

  test.each([
    [CpSolverStatus.FEASIBLE, "FEASIBLE", "valid"],
    [CpSolverStatus.INFEASIBLE, "INFEASIBLE", "invalid"],
    [CpSolverStatus.MODEL_INVALID, "MODEL_INVALID", "invalid"],
    [CpSolverStatus.UNKNOWN, "UNKNOWN", "invalid"],
  ])("decodes solver status %s", async (status, expectedStatus, validity) => {
    const output = receiver();
    await createSolverWorkerHandler(
      output.post,
      nativeFixture(status).load,
    )(request);
    expect(output.messages.get(0)).toMatchObject({
      status: expectedStatus,
      packingResult: { validity },
    });
  });

  test.each([
    null,
    { ...request, type: "OTHER" },
    { ...request, requestId: "invalid" },
    { ...request, items: [{ ...request.items[0], w: -1 }] },
    { ...request, parameters: { numWorkers: 2 } },
    { ...request, parameters: { maxTimeInSeconds: 0 } },
    { ...request, spaceTemplate: { ...request.spaceTemplate, w: Number.NaN } },
  ])(
    "rejects invalid messages before loading native code: %j",
    async (value) => {
      const output = receiver();
      const loads = new Int32Array(1);
      const handle = createSolverWorkerHandler(output.post, () => {
        Atomics.add(loads, 0, 1);
        return nativeFixture().load();
      });
      await handle(value);
      expect(output.messages.get(0)).toMatchObject({
        status: "MODEL_INVALID",
        errorCode: "INVALID_REQUEST",
      });
      expect(output.messages.get(0)?.errorMessage).toBeTruthy();
      expect(loads[0]).toBe(0);
    },
  );

  test("returns structured module load failures", async () => {
    const output = receiver();
    await createSolverWorkerHandler(output.post, () =>
      Promise.resolve({
        ok: false,
        error: {
          code: "MISSING_EXPORTS",
          missingExports: ["SolveProto"],
          message: "Missing SolveProto",
        },
      }),
    )(request);
    expect(output.messages.get(0)).toMatchObject({
      requestId: request.requestId,
      status: "MODEL_INVALID",
      errorCode: "MISSING_EXPORTS",
      errorMessage: "Missing SolveProto",
    });
  });

  test("returns structured fetch failures", async () => {
    const output = receiver();
    await createSolverWorkerHandler(output.post, () =>
      Promise.reject(new Error("Network failure")),
    )(request);
    expect(output.messages.get(0)).toMatchObject({
      status: "MODEL_INVALID",
      errorCode: "LOAD_FAILED",
      errorMessage: "Network failure",
    });
  });

  test.each([
    ["trap", "SOLVE_FAILED"],
    ["corrupt", "INVALID_RESPONSE"],
    ["badLength", "SOLVE_FAILED"],
    ["null", "SOLVE_RETURNED_NULL"],
    ["oom", "ALLOCATION_FAILED"],
  ] as const)(
    "releases all owned buffers after %s",
    async (mode, errorCode) => {
      const native = nativeFixture(CpSolverStatus.OPTIMAL, mode);
      const output = receiver();
      const handle = createSolverWorkerHandler(output.post, native.load);
      await handle(request);
      await handle(request);
      expect(output.messages.get(0)).toMatchObject({
        status: "MODEL_INVALID",
        errorCode,
      });
      expect(output.messages.get(1)).toMatchObject({
        status: "MODEL_INVALID",
        errorCode,
      });
      expect(native.allocations.size).toBe(0);
      expect(native.responses.size).toBe(0);
    },
  );

  test("registers the message handler in a separate worker thread", async () => {
    const worker = new Worker(
      new URL("./solverWorker.ts", import.meta.url).href,
    );
    try {
      const reply = new Promise<SolverWorkerResponse>((resolve, reject) => {
        worker.addEventListener(
          "message",
          (event: MessageEvent<SolverWorkerResponse>) => resolve(event.data),
          { once: true },
        );
        worker.addEventListener("error", reject, { once: true });
      });
      worker.postMessage({ ...request, parameters: { numWorkers: 2 } });
      expect(await reply).toMatchObject({
        requestId: request.requestId,
        errorCode: "INVALID_REQUEST",
        status: "MODEL_INVALID",
      });
    } finally {
      worker.terminate();
    }
  });
});
