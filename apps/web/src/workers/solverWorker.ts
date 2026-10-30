import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import type { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { SpaceTemplateSchema } from "@storagemaxxing/assembly/SpaceTemplate";
import { buildCpModel } from "@storagemaxxing/packer/cpModelBuilder";
import { decodeCpResponse } from "@storagemaxxing/packer/cpResponseDecoder";
import {
  CpModelProtoSchema,
  CpSolverResponseSchema,
  CpSolverStatus,
} from "@storagemaxxing/packer/gen/ortools/sat/cp_model_pb";
import { SatParametersSchema } from "@storagemaxxing/packer/gen/ortools/sat/sat_parameters_pb";
import {
  instantiateOrToolsSatModule,
  invokeSolveProto,
  type OrToolsSatWasmExports,
  type OrToolsSatModule,
  type WasmLoadResult,
  type WasmLoadError,
  type WasmSolveError,
  type WasmSolveResult,
} from "@storagemaxxing/packer/wasmLoader";
import { z } from "zod";

const parametersSchema = z.object({
  maxTimeInSeconds: z.number().positive().default(5),
  numWorkers: z.literal(1).default(1),
  randomSeed: z.number().int().nonnegative().max(2147483647).default(42),
  logSearchProgress: z.boolean().default(false),
});

const requestSchema = z.object({
  type: z.literal("SOLVE_SPACE"),
  requestId: z.uuid(),
  spaceTemplate: SpaceTemplateSchema,
  items: z
    .array(
      z.object({
        id: z.string(),
        w: z.number().nonnegative(),
        l: z.number().nonnegative(),
        h: z.number().nonnegative(),
        toleranceW: z.number().nonnegative().optional(),
        toleranceL: z.number().nonnegative().optional(),
        toleranceH: z.number().nonnegative().optional(),
      }),
    )
    .readonly(),
  parameters: parametersSchema.optional(),
});

export type SolverWorkerRequest = z.infer<typeof requestSchema>;

const statusSchema = z.enum([
  "OPTIMAL",
  "FEASIBLE",
  "INFEASIBLE",
  "MODEL_INVALID",
  "UNKNOWN",
]);
type WorkerErrorCode =
  | WasmLoadError["code"]
  | WasmSolveError["code"]
  | "INVALID_REQUEST"
  | "LOAD_FAILED"
  | "SOLVE_FAILED"
  | "INVALID_RESPONSE";

export type SolverWorkerResponse = {
  readonly type: "SOLVE_SPACE_RESULT";
  readonly requestId: string;
  readonly status: z.infer<typeof statusSchema>;
  readonly wallTimeMs: number;
  readonly packingResult?: PackingResult;
  readonly responseBuffer?: ArrayBuffer;
  readonly errorCode?: WorkerErrorCode;
  readonly errorMessage?: string;
};

type PostResult = (
  response: SolverWorkerResponse,
  transfer: readonly ArrayBuffer[],
) => void;

const message = (reason: unknown): string =>
  reason instanceof Error ? reason.message : String(reason);

const loadBrowserSolver = async (): Promise<WasmLoadResult> => {
  const response = await fetch("/ortools-sat.wasm");
  if (!response.ok)
    throw new Error(`Solver fetch failed with HTTP ${response.status}`);
  return instantiateOrToolsSatModule(await response.arrayBuffer());
};

// The packer bridge releases normal results; this scope also releases buffers after traps.
const solveWithCleanup = (
  exports: OrToolsSatWasmExports,
  model: Uint8Array,
  parameters: Uint8Array,
): WasmSolveResult => {
  const inputs = new Set<number>();
  const outputs = new Set<number>();
  try {
    return invokeSolveProto(
      {
        ...exports,
        malloc: (size) => {
          const pointer = exports.malloc(size);
          // eslint-disable-next-line functional/immutable-data -- Track native allocations until the bridge frees them.
          if (pointer !== 0) inputs.add(pointer);
          return pointer;
        },
        free: (pointer) => {
          exports.free(pointer);
          // eslint-disable-next-line functional/immutable-data -- Remove the released native allocation.
          inputs.delete(pointer);
        },
        SolveProto: (...args) => {
          const pointer = exports.SolveProto(...args);
          // eslint-disable-next-line functional/immutable-data -- Track response ownership before the bridge copies the buffer.
          if (pointer !== 0) outputs.add(pointer);
          return pointer;
        },
        FreeBuffer: (pointer) => {
          exports.FreeBuffer(pointer);
          // eslint-disable-next-line functional/immutable-data -- Remove the released native response.
          outputs.delete(pointer);
        },
      },
      model,
      parameters,
    );
  } finally {
    outputs.forEach(exports.FreeBuffer);
    inputs.forEach(exports.free);
  }
};

type SolveOutcome = Pick<
  SolverWorkerResponse,
  "status" | "packingResult" | "responseBuffer" | "errorCode" | "errorMessage"
>;

const solve = (
  request: SolverWorkerRequest,
  module: OrToolsSatModule,
): SolveOutcome => {
  try {
    const model = buildCpModel(request.spaceTemplate, request.items);
    const parameters = parametersSchema.parse(request.parameters ?? {});
    const result = solveWithCleanup(
      module.exports,
      toBinary(CpModelProtoSchema, model),
      toBinary(
        SatParametersSchema,
        create(SatParametersSchema, {
          numSearchWorkers: parameters.numWorkers,
          maxTimeInSeconds: parameters.maxTimeInSeconds,
          randomSeed: parameters.randomSeed,
          logSearchProgress: parameters.logSearchProgress,
        }),
      ),
    );
    if (!result.ok)
      return {
        status: "MODEL_INVALID",
        errorCode: result.error.code,
        errorMessage: result.error.message,
      };
    try {
      const response = fromBinary(CpSolverResponseSchema, result.responseBytes);
      const status = statusSchema.parse(CpSolverStatus[response.status]);
      return {
        status,
        packingResult: decodeCpResponse(
          response,
          request.items,
          request.spaceTemplate,
          model,
        ),
        responseBuffer: new Uint8Array(result.responseBytes).buffer,
      };
    } catch (reason) {
      return {
        status: "MODEL_INVALID",
        errorCode: "INVALID_RESPONSE",
        errorMessage: message(reason),
      };
    }
  } catch (reason) {
    return {
      status: "MODEL_INVALID",
      errorCode: "SOLVE_FAILED",
      errorMessage: message(reason),
    };
  }
};

const requestId = (data: unknown): string =>
  typeof data === "object" &&
  data !== null &&
  "requestId" in data &&
  typeof data.requestId === "string"
    ? data.requestId
    : "";

type WorkerLoadResult =
  | WasmLoadResult
  | {
      readonly ok: false;
      readonly error: {
        readonly code: "LOAD_FAILED";
        readonly message: string;
      };
    };

export const createSolverWorkerHandler = (
  post: PostResult,
  load: () => Promise<WasmLoadResult> = loadBrowserSolver,
) => {
  const cache = new Map<string, Promise<WorkerLoadResult>>();
  const loadOnce = (): Promise<WorkerLoadResult> => {
    const cached = cache.get("solver");
    if (cached) return cached;
    const pending = Promise.resolve()
      .then(load)
      .catch((reason: unknown): WorkerLoadResult => ({
        ok: false,
        error: { code: "LOAD_FAILED", message: message(reason) },
      }));
    // eslint-disable-next-line functional/immutable-data -- Cache the single module load shared by all requests in this worker.
    cache.set("solver", pending);
    return pending;
  };
  return async (data: unknown): Promise<void> => {
    const started = performance.now();
    const parsed = requestSchema.safeParse(data);
    if (!parsed.success) {
      post(
        {
          type: "SOLVE_SPACE_RESULT",
          requestId: requestId(data),
          status: "MODEL_INVALID",
          wallTimeMs: performance.now() - started,
          errorCode: "INVALID_REQUEST",
          errorMessage: parsed.error.message,
        },
        [],
      );
      return;
    }
    const loaded = await loadOnce();
    const outcome: SolveOutcome = loaded.ok
      ? solve(parsed.data, loaded.module)
      : {
          status: "MODEL_INVALID",
          errorCode: loaded.error.code,
          errorMessage: loaded.error.message,
        };
    const response: SolverWorkerResponse = {
      type: "SOLVE_SPACE_RESULT",
      requestId: parsed.data.requestId,
      wallTimeMs: performance.now() - started,
      ...outcome,
    };
    const transfer = [response.responseBuffer].filter(
      (buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer,
    );
    post(response, transfer);
  };
};

// A synchronous native search must be cancelled by terminating this worker from its owner.
if (
  typeof self !== "undefined" &&
  typeof self.postMessage === "function" &&
  typeof document === "undefined"
) {
  const handle = createSolverWorkerHandler((response, transfer) =>
    self.postMessage(response, { transfer: [...transfer] }),
  );
  self.addEventListener("message", (event: MessageEvent<unknown>) => {
    void handle(event.data);
  });
}
