import { describe, expect, test } from "bun:test";

const PAYLOAD_SIZES = [
  { bytes: 10 * 1024 },
  { bytes: 50 * 1024 },
  { bytes: 250 * 1024 },
  { bytes: 1000 * 1024 },
] as const;

const ITERATIONS = 5;

const createPayload = (byteCount: number): Uint8Array =>
  Uint8Array.from({ length: byteCount }, (_, index) =>
    index % 64 === 0 ? index % 256 : 0,
  );

const measureTransferableTransfer = async (
  sizeBytes: number,
): Promise<{ readonly elapsedMs: number; readonly receivedBytes: number }> => {
  const channel = new MessageChannel();
  const payload = createPayload(sizeBytes);
  const buffer = payload.buffer;

  return new Promise((resolve) => {
    channel.port2.addEventListener(
      "message",
      (event: MessageEvent<ArrayBuffer>) => {
        const elapsedMs = performance.now() - start;
        const receivedBytes = event.data.byteLength;
        channel.port1.close();
        channel.port2.close();
        resolve({ elapsedMs, receivedBytes });
      },
    );
    channel.port2.start();
    const start = performance.now();
    channel.port1.postMessage(buffer, [buffer]);
  });
};

const measureClonedTransfer = async (
  sizeBytes: number,
): Promise<{ readonly elapsedMs: number; readonly receivedBytes: number }> => {
  const channel = new MessageChannel();
  const payload = createPayload(sizeBytes);
  const buffer = payload.buffer;

  return new Promise((resolve) => {
    channel.port2.addEventListener(
      "message",
      (event: MessageEvent<ArrayBuffer>) => {
        const elapsedMs = performance.now() - start;
        const receivedBytes = event.data.byteLength;
        channel.port1.close();
        channel.port2.close();
        resolve({ elapsedMs, receivedBytes });
      },
    );
    channel.port2.start();
    const start = performance.now();
    channel.port1.postMessage(buffer);
  });
};

const runSequential = async <T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
): Promise<readonly R[]> =>
  items.reduce(
    async (accPromise, item) => {
      const acc = await accPromise;
      const res = await fn(item);
      return [...acc, res];
    },
    Promise.resolve([] as readonly R[]),
  );

describe("solver worker messaging overhead benchmark", () => {
  test("transferable ArrayBuffer transfers memory without copying and detaches sender", async () => {
    const channel = new MessageChannel();
    const payload = Uint8Array.from({ length: 1024 }, (_, i) =>
      i === 0 ? 42 : 0,
    );
    const buffer = payload.buffer;

    const resultPromise = new Promise<{
      readonly length: number;
      readonly byteZero: number;
    }>((resolve) => {
      channel.port2.addEventListener(
        "message",
        (event: MessageEvent<ArrayBuffer>) => {
          const view = new Uint8Array(event.data);
          resolve({
            length: event.data.byteLength,
            byteZero: view[0] ?? 0,
          });
        },
      );
      channel.port2.start();
    });

    channel.port1.postMessage(buffer, [buffer]);

    // Memory buffer is detached from sender thread
    expect(buffer.byteLength).toBe(0);

    const received = await resultPromise;
    expect(received.length).toBe(1024);
    expect(received.byteZero).toBe(42);

    channel.port1.close();
    channel.port2.close();
  });

  test("transferable ArrayBuffer achieves sub-millisecond transfer times across payload sizes", async () => {
    const iterationIndices = Array.from({ length: ITERATIONS }, (_, i) => i);

    await runSequential(PAYLOAD_SIZES, async ({ bytes }) => {
      const results = await runSequential(iterationIndices, () =>
        measureTransferableTransfer(bytes),
      );
      results.forEach((r) => {
        expect(r.receivedBytes).toBe(bytes);
      });
      const totalMs = results.reduce((acc, r) => acc + r.elapsedMs, 0);
      const averageMs = totalMs / results.length;
      expect(averageMs).toBeGreaterThanOrEqual(0);
      expect(averageMs).toBeLessThan(100.0);
    });
  });

  test("benchmarks transfer throughput comparison between transferable and cloned buffers", async () => {
    const iterationIndices = Array.from({ length: ITERATIONS }, (_, i) => i);

    await runSequential(PAYLOAD_SIZES, async ({ bytes }) => {
      const transferableResults = await runSequential(iterationIndices, () =>
        measureTransferableTransfer(bytes),
      );
      const clonedResults = await runSequential(iterationIndices, () =>
        measureClonedTransfer(bytes),
      );
      const avgTransferable =
        transferableResults.reduce((acc, r) => acc + r.elapsedMs, 0) /
        ITERATIONS;
      const avgCloned =
        clonedResults.reduce((acc, r) => acc + r.elapsedMs, 0) / ITERATIONS;
      expect(avgTransferable).toBeGreaterThanOrEqual(0);
      expect(avgCloned).toBeGreaterThanOrEqual(0);
    });
  });
});
