import { describe, expect, test } from "bun:test";
import {
  type FreeBufferFn,
  type OrToolsSatModule,
  type OrToolsSatWasmExports,
  type SolveProtoBufferFn,
  type SolveProtoRawFn,
  type WasmFreeFn,
  type WasmLoadError,
  type WasmLoadResult,
  type WasmMallocFn,
  type WasmModuleImports,
  type WasmSolveError,
  type WasmSolveResult,
  type WasmSource,
  instantiateOrToolsSatModule,
  invokeSolveProto,
} from "./wasmLoader";

const encodeUleb128 = (value: number): readonly number[] => {
  const byte = value & 0x7f;
  const rest = value >>> 7;
  return rest === 0 ? [byte] : [byte | 0x80, ...encodeUleb128(rest)];
};

const encodeString = (text: string): readonly number[] => {
  const utf8 = Array.from(new TextEncoder().encode(text));
  return [...encodeUleb128(utf8.length), ...utf8];
};

const encodeSection = (
  sectionId: number,
  payload: readonly number[],
): readonly number[] => [
  sectionId,
  ...encodeUleb128(payload.length),
  ...payload,
];

const encodeVec = (items: readonly (readonly number[])[]): readonly number[] =>
  items.reduce<readonly number[]>(
    (acc, item) => [...acc, ...item],
    encodeUleb128(items.length),
  );

const buildMallocBody = (): readonly number[] => {
  const instructions: readonly number[] = [
    // if (size < 0) return 0
    0x20, 0x00, 0x41, 0x00, 0x48, 0x04, 0x40, 0x41, 0x00, 0x0f, 0x0b,
    // if (size > 65536) return 0
    0x20, 0x00, 0x41, 0x80, 0x80, 0x04, 0x4a, 0x04, 0x40, 0x41, 0x00, 0x0f,
    0x0b,
    // aligned = (size + 7) & -4
    0x20, 0x00, 0x41, 0x07, 0x6a, 0x41, 0x7c, 0x71, 0x21, 0x02,
    // ptr = heap_ptr; heap_ptr = ptr + aligned; return ptr
    0x23, 0x00, 0x22, 0x01, 0x20, 0x02, 0x6a, 0x24, 0x00, 0x20, 0x01, 0x0b,
  ];
  const body = [0x01, 0x02, 0x7f, ...instructions];
  return [...encodeUleb128(body.length), ...body];
};

const buildFreeBody = (): readonly number[] => {
  // if (ptr != 0) mem[4] = mem[4] + 1
  const instructions: readonly number[] = [
    0x20, 0x00, 0x04, 0x40, 0x41, 0x04, 0x41, 0x04, 0x28, 0x00, 0x00, 0x41,
    0x01, 0x6a, 0x36, 0x00, 0x00, 0x0b, 0x0b,
  ];
  const body = [0x00, ...instructions];
  return [...encodeUleb128(body.length), ...body];
};

const buildFreeBufferBody = (freeFuncIdx: number): readonly number[] => {
  // if (ptr != 0) { mem[0] = mem[0] + 1; free(ptr); }
  const instructions: readonly number[] = [
    0x20,
    0x00,
    0x04,
    0x40,
    0x41,
    0x00,
    0x41,
    0x00,
    0x28,
    0x00,
    0x00,
    0x41,
    0x01,
    0x6a,
    0x36,
    0x00,
    0x00,
    0x20,
    0x00,
    0x10,
    ...encodeUleb128(freeFuncIdx),
    0x0b,
    0x0b,
  ];
  const body = [0x00, ...instructions];
  return [...encodeUleb128(body.length), ...body];
};

const buildSolveProtoBody = (
  mallocFuncIdx: number,
  notifyImportFuncIdx?: number,
): readonly number[] => {
  const notifyCall: readonly number[] =
    notifyImportFuncIdx !== undefined
      ? [0x41, 0x00, 0x10, ...encodeUleb128(notifyImportFuncIdx)]
      : [];
  const instructions: readonly number[] = [
    ...notifyCall,
    // if (out_len_ptr == 0) return 0
    0x20,
    0x04,
    0x45,
    0x04,
    0x40,
    0x41,
    0x00,
    0x0f,
    0x0b,
    // status = 4 (OPTIMAL)
    0x41,
    0x04,
    0x21,
    0x05,
    // if (model_len > 0 && model_ptr != 0) inspect model_bytes[0]
    0x20,
    0x01,
    0x41,
    0x00,
    0x4a,
    0x04,
    0x40,
    0x20,
    0x00,
    0x04,
    0x40,
    // if (model_bytes[0] == 254) { *out_len_ptr = 0; return 0; }
    0x20,
    0x00,
    0x2d,
    0x00,
    0x00,
    0x41,
    0xfe,
    0x01,
    0x46,
    0x04,
    0x40,
    0x20,
    0x04,
    0x41,
    0x00,
    0x36,
    0x00,
    0x00,
    0x41,
    0x00,
    0x0f,
    0x0b,
    // if (model_bytes[0] == 255) status = 1 (MODEL_INVALID)
    0x20,
    0x00,
    0x2d,
    0x00,
    0x00,
    0x41,
    0xff,
    0x01,
    0x46,
    0x04,
    0x40,
    0x41,
    0x01,
    0x21,
    0x05,
    0x0b,
    0x0b,
    0x0b,
    // res_ptr = malloc(4)
    0x41,
    0x04,
    0x10,
    ...encodeUleb128(mallocFuncIdx),
    0x21,
    0x06,
    // res_ptr[0] = 0x08 (field 1 tag), res_ptr[1] = status, res_ptr[2] = model_len
    0x20,
    0x06,
    0x41,
    0x08,
    0x3a,
    0x00,
    0x00,
    0x20,
    0x06,
    0x20,
    0x05,
    0x3a,
    0x00,
    0x01,
    0x20,
    0x06,
    0x20,
    0x01,
    0x3a,
    0x00,
    0x02,
    // res_ptr[3] = (params_len > 0 && params_ptr != 0) ? params_bytes[0] : 0
    0x20,
    0x06,
    0x20,
    0x03,
    0x41,
    0x00,
    0x4a,
    0x04,
    0x7f,
    0x20,
    0x02,
    0x04,
    0x7f,
    0x20,
    0x02,
    0x2d,
    0x00,
    0x00,
    0x05,
    0x41,
    0x00,
    0x0b,
    0x05,
    0x41,
    0x00,
    0x0b,
    0x3a,
    0x00,
    0x03,
    // *out_len_ptr = 4; return res_ptr
    0x20,
    0x04,
    0x41,
    0x04,
    0x36,
    0x00,
    0x00,
    0x20,
    0x06,
    0x0b,
  ];
  const body = [0x01, 0x02, 0x7f, ...instructions];
  return [...encodeUleb128(body.length), ...body];
};

type FixtureOptions = {
  readonly underscorePrefix?: boolean;
  readonly withEmscriptenImports?: boolean;
};

const createOrToolsSatFixtureWasm = (
  options: FixtureOptions = {},
): Uint8Array => {
  const prefix = options.underscorePrefix ? "_" : "";
  const withImports = options.withEmscriptenImports ?? false;
  const importedFuncCount = withImports ? 2 : 0;

  const typeSection = encodeSection(
    1,
    encodeVec([
      [0x60, 0x01, 0x7f, 0x01, 0x7f],
      [0x60, 0x01, 0x7f, 0x00],
      [0x60, 0x05, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x01, 0x7f],
      [0x60, 0x04, 0x7f, 0x7f, 0x7f, 0x7f, 0x01, 0x7f],
    ]),
  );

  const importSection = withImports
    ? encodeSection(
        2,
        encodeVec([
          [
            ...encodeString("wasi_snapshot_preview1"),
            ...encodeString("fd_write"),
            0x00,
            0x03,
          ],
          [
            ...encodeString("env"),
            ...encodeString("emscripten_notify_memory_growth"),
            0x00,
            0x01,
          ],
        ]),
      )
    : [];

  const funcSection = encodeSection(
    3,
    encodeVec([[0x00], [0x01], [0x01], [0x02]]),
  );
  const memorySection = encodeSection(5, encodeVec([[0x01, 0x02, 0x04]]));
  const globalSection = encodeSection(
    6,
    encodeVec([[0x7f, 0x01, 0x41, 0x80, 0x08, 0x0b]]),
  );

  const exportSection = encodeSection(
    7,
    encodeVec([
      [...encodeString("memory"), 0x02, 0x00],
      [...encodeString(`${prefix}malloc`), 0x00, importedFuncCount + 0],
      [...encodeString(`${prefix}free`), 0x00, importedFuncCount + 1],
      [...encodeString(`${prefix}FreeBuffer`), 0x00, importedFuncCount + 2],
      [...encodeString(`${prefix}SolveProto`), 0x00, importedFuncCount + 3],
    ]),
  );

  const codeSection = encodeSection(
    10,
    encodeVec([
      buildMallocBody(),
      buildFreeBody(),
      buildFreeBufferBody(importedFuncCount + 1),
      buildSolveProtoBody(importedFuncCount + 0, withImports ? 1 : undefined),
    ]),
  );

  return new Uint8Array([
    0x00,
    0x61,
    0x73,
    0x6d,
    0x01,
    0x00,
    0x00,
    0x00,
    ...typeSection,
    ...importSection,
    ...funcSection,
    ...memorySection,
    ...globalSection,
    ...exportSection,
    ...codeSection,
  ]);
};

describe("wasmLoader", () => {
  test("instantiates minimal ortools-sat.wasm binary and exports SolveProto and FreeBuffer", async () => {
    const wasmSource: WasmSource = createOrToolsSatFixtureWasm();
    const loadResult: WasmLoadResult =
      await instantiateOrToolsSatModule(wasmSource);

    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;

    const mod: OrToolsSatModule = loadResult.module;
    const exports: OrToolsSatWasmExports = mod.exports;
    const solveRaw: SolveProtoRawFn = mod.SolveProto;
    const freeBuffer: FreeBufferFn = mod.FreeBuffer;
    const malloc: WasmMallocFn = mod.malloc;
    const free: WasmFreeFn = mod.free;
    const solveBuffer: SolveProtoBufferFn = mod.solveProto;

    expect(typeof solveRaw).toBe("function");
    expect(typeof freeBuffer).toBe("function");
    expect(typeof malloc).toBe("function");
    expect(typeof free).toBe("function");
    expect(typeof solveBuffer).toBe("function");
    expect(exports.SolveProto).toBe(solveRaw);
    expect(exports.FreeBuffer).toBe(freeBuffer);
    expect(mod.memory).toBeInstanceOf(WebAssembly.Memory);
    expect(mod.wasmModule).toBeInstanceOf(WebAssembly.Module);
    expect(mod.instance).toBeInstanceOf(WebAssembly.Instance);
  });

  test("invokes low-level pointer-based SolveProto and FreeBuffer on WASM linear memory", async () => {
    const loadResult = await instantiateOrToolsSatModule(
      createOrToolsSatFixtureWasm(),
    );
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;

    const { SolveProto, FreeBuffer, malloc, free, memory } = loadResult.module;

    const modelPayload = new Uint8Array([0x0a, 0x02, 0x08, 0x01]);
    const paramsPayload = new Uint8Array([0x2a]);
    const modelPtr = malloc(modelPayload.byteLength);
    const paramsPtr = malloc(paramsPayload.byteLength);
    const outLenPtr = malloc(4);

    expect(modelPtr).toBeGreaterThan(0);
    expect(paramsPtr).toBeGreaterThan(0);
    expect(outLenPtr).toBeGreaterThan(0);

    new Uint8Array(memory.buffer, modelPtr, modelPayload.byteLength).set(
      modelPayload,
    );
    new Uint8Array(memory.buffer, paramsPtr, paramsPayload.byteLength).set(
      paramsPayload,
    );

    const responsePtr = SolveProto(
      modelPtr,
      modelPayload.byteLength,
      paramsPtr,
      paramsPayload.byteLength,
      outLenPtr,
    );
    expect(responsePtr).toBeGreaterThan(0);

    const view = new DataView(memory.buffer);
    const outLen = view.getInt32(outLenPtr, true);
    expect(outLen).toBe(4);

    const responseBytes = new Uint8Array(
      memory.buffer,
      responsePtr,
      outLen,
    ).slice();
    expect(Array.from(responseBytes)).toEqual([0x08, 0x04, 0x04, 0x2a]);

    free(modelPtr);
    free(paramsPtr);
    free(outLenPtr);
    FreeBuffer(responsePtr);

    // Counter at offset 0 tracks FreeBuffer calls; offset 4 tracks total free calls
    expect(view.getInt32(0, true)).toBe(1);
    expect(view.getInt32(4, true)).toBe(4);
  });

  test("invokes high-level Uint8Array solveProto bridge and releases native heap allocations", async () => {
    const loadResult = await instantiateOrToolsSatModule(
      createOrToolsSatFixtureWasm(),
    );
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;

    const mod = loadResult.module;
    const modelBytes = new Uint8Array([0x12, 0x03, 0x01, 0x02, 0x03]);
    const paramsBytes = new Uint8Array([0x77]);

    const solveResult: WasmSolveResult = mod.solveProto(
      modelBytes,
      paramsBytes,
    );
    expect(solveResult.ok).toBe(true);
    if (!solveResult.ok) return;

    expect(Array.from(solveResult.responseBytes)).toEqual([
      0x08, 0x04, 0x05, 0x77,
    ]);

    // Empty model and omitted paramsBytes also execute and release memory cleanly
    const emptyResult = invokeSolveProto(mod.exports, new Uint8Array(0));
    expect(emptyResult.ok).toBe(true);
    if (!emptyResult.ok) return;
    expect(Array.from(emptyResult.responseBytes)).toEqual([
      0x08, 0x04, 0x00, 0x00,
    ]);

    const view = new DataView(mod.memory.buffer);
    expect(view.getInt32(0, true)).toBe(2);
  });

  test("supports Emscripten underscore-prefixed exports, auto-stubbed WASI imports, and cached WebAssembly.Module", async () => {
    const emscriptenBytes = createOrToolsSatFixtureWasm({
      underscorePrefix: true,
      withEmscriptenImports: true,
    });

    // Instantiates without custom imports (auto-stubs single-threaded WASI/env imports)
    const firstLoad = await instantiateOrToolsSatModule(emscriptenBytes);
    expect(firstLoad.ok).toBe(true);
    if (!firstLoad.ok) return;

    const autoStubSolve = firstLoad.module.solveProto(
      new Uint8Array([0x08, 0x01]),
    );
    expect(autoStubSolve.ok).toBe(true);

    const notifyCounter = new Int32Array(1);
    const customImports: WasmModuleImports = {
      env: {
        emscripten_notify_memory_growth: () => {
          Atomics.add(notifyCounter, 0, 1);
        },
      },
    };

    // Re-instantiates directly from cached WebAssembly.Module with caller imports
    const cachedLoad = await instantiateOrToolsSatModule(
      firstLoad.module.wasmModule,
      customImports,
    );
    expect(cachedLoad.ok).toBe(true);
    if (!cachedLoad.ok) return;

    const invalidModelSolve = cachedLoad.module.solveProto(
      new Uint8Array([0xff]),
    );
    expect(invalidModelSolve.ok).toBe(true);
    if (!invalidModelSolve.ok) return;
    expect(Array.from(invalidModelSolve.responseBytes)).toEqual([
      0x08, 0x01, 0x01, 0x00,
    ]);
    expect(notifyCounter[0]).toBe(1);
  });

  test("returns structured error results without throwing on invalid WASM, missing exports, or failed solve", async () => {
    // 1. Corrupt WASM bytes -> INSTANTIATION_FAILED
    const corruptLoad = await instantiateOrToolsSatModule(
      new Uint8Array([0x00, 0x01, 0x02, 0x03]),
    );
    expect(corruptLoad.ok).toBe(false);
    if (corruptLoad.ok) return;
    const loadErr: WasmLoadError = corruptLoad.error;
    expect(loadErr.code).toBe("INSTANTIATION_FAILED");

    // 2. Valid empty WASM module missing OR-Tools exports -> MISSING_EXPORTS
    const emptyWasm = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    ]);
    const missingExportsLoad = await instantiateOrToolsSatModule(
      emptyWasm.buffer,
    );
    expect(missingExportsLoad.ok).toBe(false);
    if (missingExportsLoad.ok) return;
    expect(missingExportsLoad.error.code).toBe("MISSING_EXPORTS");
    if (missingExportsLoad.error.code === "MISSING_EXPORTS") {
      expect(missingExportsLoad.error.missingExports).toEqual([
        "SolveProto",
        "FreeBuffer",
        "malloc",
        "free",
        "memory",
      ]);
    }

    // 3. Allocation failure and nullptr return in invokeSolveProto -> WasmSolveError
    const validLoad = await instantiateOrToolsSatModule(
      createOrToolsSatFixtureWasm(),
    );
    expect(validLoad.ok).toBe(true);
    if (!validLoad.ok) return;

    const oomResult = validLoad.module.solveProto(new Uint8Array(70_000));
    expect(oomResult.ok).toBe(false);
    if (!oomResult.ok) {
      const solveErr: WasmSolveError = oomResult.error;
      expect(solveErr.code).toBe("ALLOCATION_FAILED");
    }

    const nullSolveResult = validLoad.module.solveProto(new Uint8Array([0xfe]));
    expect(nullSolveResult.ok).toBe(false);
    if (!nullSolveResult.ok) {
      expect(nullSolveResult.error.code).toBe("SOLVE_RETURNED_NULL");
    }
  });
});
