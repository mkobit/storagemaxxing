/**
 * Pure functional WebAssembly loader and binary Protobuf memory bridge
 * for the single-threaded Google OR-Tools CP-SAT solver (`ortools-sat.wasm`).
 */

export type SolveProtoRawFn = (
  ...args: readonly [
    modelPtr: number,
    modelLen: number,
    paramsPtr: number,
    paramsLen: number,
    outLenPtr: number,
  ]
) => number;

export type FreeBufferFn = (ptr: number) => void;

export type WasmMallocFn = (size: number) => number;

export type WasmFreeFn = (ptr: number) => void;

export interface OrToolsSatWasmExports {
  readonly SolveProto: SolveProtoRawFn;
  readonly FreeBuffer: FreeBufferFn;
  readonly malloc: WasmMallocFn;
  readonly free: WasmFreeFn;
  readonly memory: WebAssembly.Memory;
}

export type WasmSolveError =
  | { readonly code: "ALLOCATION_FAILED"; readonly message: string }
  | { readonly code: "SOLVE_RETURNED_NULL"; readonly message: string };

export type WasmSolveResult =
  | { readonly ok: true; readonly responseBytes: Uint8Array }
  | { readonly ok: false; readonly error: WasmSolveError };

export type SolveProtoBufferFn = (
  modelBytes: Uint8Array,
  paramsBytes?: Uint8Array,
) => WasmSolveResult;

export interface OrToolsSatModule extends OrToolsSatWasmExports {
  readonly wasmModule: WebAssembly.Module;
  readonly instance: WebAssembly.Instance;
  readonly exports: OrToolsSatWasmExports;
  readonly solveProto: SolveProtoBufferFn;
}

export type WasmSource = BufferSource | Uint8Array | WebAssembly.Module;

export type WasmModuleImports = Readonly<
  Record<string, Readonly<Record<string, WebAssembly.ImportValue>>>
>;

export type WasmLoadError =
  | {
      readonly code: "INSTANTIATION_FAILED";
      readonly message: string;
    }
  | {
      readonly code: "MISSING_EXPORTS";
      readonly missingExports: readonly string[];
      readonly message: string;
    };

export type WasmLoadResult =
  | { readonly ok: true; readonly module: OrToolsSatModule }
  | { readonly ok: false; readonly error: WasmLoadError };

type AllocatedBuffer = {
  readonly ptr: number;
  readonly bytes: Uint8Array;
  readonly failed: boolean;
};

const EMPTY_BYTES = new Uint8Array(0);

const withEffects = <T>(value: T, effects: readonly unknown[]): T =>
  effects.reduce<T>((acc) => acc, value);

const formatReason = (reason: unknown): string =>
  reason instanceof Error ? reason.message : String(reason);

const isSolveProtoFn = (
  value: WebAssembly.ExportValue | undefined,
): value is SolveProtoRawFn => typeof value === "function";

const isVoidPtrFn = (
  value: WebAssembly.ExportValue | undefined,
): value is FreeBufferFn => typeof value === "function";

const isMallocFn = (
  value: WebAssembly.ExportValue | undefined,
): value is WasmMallocFn => typeof value === "function";

const isWasmMemory = (
  value: WebAssembly.ExportValue | undefined,
): value is WebAssembly.Memory => value instanceof WebAssembly.Memory;

const resolveExportSymbol = (
  rawExports: WebAssembly.Exports,
  name: string,
): WebAssembly.ExportValue | undefined =>
  rawExports[name] ?? rawExports[`_${name}`];

const findMissingExports = (
  rawExports: WebAssembly.Exports,
): readonly string[] => {
  const checks: readonly (readonly [string, boolean])[] = [
    [
      "SolveProto",
      isSolveProtoFn(resolveExportSymbol(rawExports, "SolveProto")),
    ],
    ["FreeBuffer", isVoidPtrFn(resolveExportSymbol(rawExports, "FreeBuffer"))],
    ["malloc", isMallocFn(resolveExportSymbol(rawExports, "malloc"))],
    ["free", isVoidPtrFn(resolveExportSymbol(rawExports, "free"))],
    ["memory", isWasmMemory(resolveExportSymbol(rawExports, "memory"))],
  ];
  return checks.filter(([, valid]) => !valid).map(([name]) => name);
};

const extractWasmExports = (
  rawExports: WebAssembly.Exports,
):
  | { readonly ok: true; readonly exports: OrToolsSatWasmExports }
  | { readonly ok: false; readonly error: WasmLoadError } => {
  const SolveProto = resolveExportSymbol(rawExports, "SolveProto");
  const FreeBuffer = resolveExportSymbol(rawExports, "FreeBuffer");
  const malloc = resolveExportSymbol(rawExports, "malloc");
  const free = resolveExportSymbol(rawExports, "free");
  const memory = resolveExportSymbol(rawExports, "memory");

  if (
    !isSolveProtoFn(SolveProto) ||
    !isVoidPtrFn(FreeBuffer) ||
    !isMallocFn(malloc) ||
    !isVoidPtrFn(free) ||
    !isWasmMemory(memory)
  ) {
    const missingExports = findMissingExports(rawExports);
    return {
      ok: false,
      error: {
        code: "MISSING_EXPORTS",
        missingExports,
        message: `WebAssembly module missing required exports: ${missingExports.join(", ")}`,
      },
    };
  }

  return {
    ok: true,
    exports: { SolveProto, FreeBuffer, malloc, free, memory },
  };
};

const stubImportFn = (): number => 0;

const buildStubEntries = (
  compiledModule: WebAssembly.Module,
): WasmModuleImports =>
  WebAssembly.Module.imports(compiledModule).reduce<WasmModuleImports>(
    (acc, desc) =>
      desc.kind === "function"
        ? {
            ...acc,
            [desc.module]: {
              ...acc[desc.module],
              [desc.name]: stubImportFn,
            },
          }
        : acc,
    {},
  );

const resolveModuleImports = (
  compiledModule: WebAssembly.Module,
  imports?: WasmModuleImports,
): WebAssembly.Imports => {
  const stubs = buildStubEntries(compiledModule);
  const moduleNames = new Set([
    ...Object.keys(stubs),
    ...Object.keys(imports ?? {}),
  ]);
  return Object.fromEntries(
    Array.from(moduleNames, (modName) => [
      modName,
      { ...stubs[modName], ...imports?.[modName] },
    ]),
  );
};

const compileWasmModule = (source: WasmSource): Promise<WebAssembly.Module> =>
  source instanceof WebAssembly.Module
    ? Promise.resolve(source)
    : WebAssembly.compile(
        source instanceof Uint8Array ? new Uint8Array(source) : source,
      );

const allocateInputBuffer = (
  malloc: WasmMallocFn,
  bytes: Uint8Array | undefined,
): AllocatedBuffer => {
  const payload = bytes ?? EMPTY_BYTES;
  if (payload.byteLength === 0) {
    return { ptr: 0, bytes: payload, failed: false };
  }
  const ptr = malloc(payload.byteLength);
  return { ptr, bytes: payload, failed: ptr === 0 };
};

const freeIfNonZero = (free: WasmFreeFn, ptr: number): void =>
  ptr !== 0 ? free(ptr) : undefined;

const writeInputBuffer = (
  memory: WebAssembly.Memory,
  input: AllocatedBuffer,
): void =>
  input.ptr !== 0
    ? new Uint8Array(memory.buffer, input.ptr, input.bytes.byteLength).set(
        input.bytes,
      )
    : undefined;

const resetInt32At = (memory: WebAssembly.Memory, ptr: number): void =>
  new DataView(memory.buffer).setInt32(ptr, 0, true);

const executeRawSolve = (
  exports: OrToolsSatWasmExports,
  modelAlloc: AllocatedBuffer,
  paramsAlloc: AllocatedBuffer,
  outLenPtr: number,
): number => {
  const preparedOutLenPtr = withEffects(outLenPtr, [
    resetInt32At(exports.memory, outLenPtr),
    writeInputBuffer(exports.memory, modelAlloc),
    writeInputBuffer(exports.memory, paramsAlloc),
  ]);
  return exports.SolveProto(
    modelAlloc.ptr,
    modelAlloc.bytes.byteLength,
    paramsAlloc.ptr,
    paramsAlloc.bytes.byteLength,
    preparedOutLenPtr,
  );
};

const extractResponseResult = (
  exports: OrToolsSatWasmExports,
  responsePtr: number,
  outLenPtr: number,
): WasmSolveResult => {
  const outLen = new DataView(exports.memory.buffer).getInt32(outLenPtr, true);
  if (responsePtr === 0 || outLen < 0) {
    return withEffects(
      {
        ok: false,
        error: {
          code: "SOLVE_RETURNED_NULL",
          message:
            "SolveProto returned a null pointer or negative buffer length.",
        },
      },
      [freeIfNonZero(exports.FreeBuffer, responsePtr)],
    );
  }
  const responseBytes = new Uint8Array(
    exports.memory.buffer,
    responsePtr,
    outLen,
  ).slice();
  return withEffects({ ok: true, responseBytes }, [
    exports.FreeBuffer(responsePtr),
  ]);
};

export const invokeSolveProto = (
  exports: OrToolsSatWasmExports,
  modelBytes: Uint8Array,
  paramsBytes?: Uint8Array,
): WasmSolveResult => {
  const outLenPtr = exports.malloc(4);
  const modelAlloc = allocateInputBuffer(exports.malloc, modelBytes);
  const paramsAlloc = allocateInputBuffer(exports.malloc, paramsBytes);

  if (outLenPtr === 0 || modelAlloc.failed || paramsAlloc.failed) {
    return withEffects(
      {
        ok: false,
        error: {
          code: "ALLOCATION_FAILED",
          message:
            "Failed to allocate WebAssembly heap memory for SolveProto inputs.",
        },
      },
      [
        freeIfNonZero(exports.free, outLenPtr),
        freeIfNonZero(exports.free, modelAlloc.ptr),
        freeIfNonZero(exports.free, paramsAlloc.ptr),
      ],
    );
  }

  const responsePtr = executeRawSolve(
    exports,
    modelAlloc,
    paramsAlloc,
    outLenPtr,
  );

  return withEffects(extractResponseResult(exports, responsePtr, outLenPtr), [
    freeIfNonZero(exports.free, modelAlloc.ptr),
    freeIfNonZero(exports.free, paramsAlloc.ptr),
    exports.free(outLenPtr),
  ]);
};

const buildOrToolsSatModule = (
  wasmModule: WebAssembly.Module,
  instance: WebAssembly.Instance,
  exports: OrToolsSatWasmExports,
): OrToolsSatModule => ({
  wasmModule,
  instance,
  exports,
  SolveProto: exports.SolveProto,
  FreeBuffer: exports.FreeBuffer,
  malloc: exports.malloc,
  free: exports.free,
  memory: exports.memory,
  solveProto: (modelBytes, paramsBytes) =>
    invokeSolveProto(exports, modelBytes, paramsBytes),
});

export const instantiateOrToolsSatModule = (
  wasmSource: WasmSource,
  imports?: WasmModuleImports,
): Promise<WasmLoadResult> =>
  Promise.resolve()
    .then(() => compileWasmModule(wasmSource))
    .then((wasmModule) =>
      WebAssembly.instantiate(
        wasmModule,
        resolveModuleImports(wasmModule, imports),
      ).then((instance): WasmLoadResult => {
        const extracted = extractWasmExports(instance.exports);
        return extracted.ok
          ? {
              ok: true,
              module: buildOrToolsSatModule(
                wasmModule,
                instance,
                extracted.exports,
              ),
            }
          : extracted;
      }),
    )
    .then(
      (result) => result,
      (reason: unknown): WasmLoadResult => ({
        ok: false,
        error: {
          code: "INSTANTIATION_FAILED",
          message: formatReason(reason),
        },
      }),
    );
