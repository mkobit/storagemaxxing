/* eslint-disable functional/no-expression-statements */
import { describe, expect, test } from "bun:test";
import { computeBom } from "./bom.js";
import type { BinSpec } from "@storagemaxxing/catalog/bin.js";
import type { PackingResult } from "@storagemaxxing/packer/types.js";
import { binId } from "@storagemaxxing/catalog/bin.js";
import { BinSpecIdSchema } from "./BaseTypes.js";
import type { Dimensions3D } from "@storagemaxxing/geometry/index.js";

const parseId = (id: string) => BinSpecIdSchema.parse(id);

const mockDimensions = { w: 1, l: 1, h: 1 } as unknown as Dimensions3D<number>;

const mockCatalog: Readonly<
  Record<
    string,
    Readonly<
      BinSpec & { readonly price?: number; readonly priceApproximate?: boolean }
    >
  >
> = {
  "bin-1": {
    id: binId("bin-1"),
    name: "Bin 1",
    sku: "SKU-1",
    vendor: "Vendor A",
    catalogSource: "builtin",
    nominal: mockDimensions,
    actual: mockDimensions,
    tolerance: mockDimensions,
    price: 10,
  },
  "bin-2": {
    id: binId("bin-2"),
    name: "Bin 2",
    sku: "SKU-2",
    vendor: "Vendor B",
    catalogSource: "builtin",
    nominal: mockDimensions,
    actual: mockDimensions,
    tolerance: mockDimensions,
    price: 15,
    priceApproximate: true,
  },
  "gridfinity-1": {
    id: binId("gridfinity-1"),
    name: "Gridfinity 1x1",
    sku: "GF-11",
    vendor: "Gridfinity",
    catalogSource: "builtin",
    nominal: mockDimensions,
    actual: mockDimensions,
    tolerance: mockDimensions,
    price: 0,
  },
};

const lookupBin = (id: string): BinSpec | undefined => mockCatalog[id];

describe("computeBom", () => {
  test("calculates happy path with direct Record", () => {
    const counts = {
      "bin-1": 2,
      "bin-2": 1,
    };

    const bom = computeBom(counts, lookupBin);

    expect(bom.items).toHaveLength(2);
    expect(bom.items.find((i) => i.binId === parseId("bin-1"))?.quantity).toBe(
      2,
    );
    expect(bom.items.find((i) => i.binId === parseId("bin-2"))?.quantity).toBe(
      1,
    );

    expect(bom.totalPrice).toBe(2 * 10 + 1 * 15);
    expect(bom.isApproximatePrice).toBe(true); // bin-2 has priceApproximate
  });

  test("calculates happy path with PackingResult", () => {
    const result: PackingResult = {
      placedBins: [],
      validity: "valid",
      metrics: {
        placedCounts: {
          "bin-1": 3,
        },
        areaUtilization: 0.5,
        failures: [],
      },
    };

    const bom = computeBom(result, lookupBin);

    expect(bom.items).toHaveLength(1);
    expect(bom.items[0].binId).toBe(parseId("bin-1"));
    expect(bom.items[0].quantity).toBe(3);

    expect(bom.totalPrice).toBe(30);
    expect(bom.isApproximatePrice).toBe(false);
  });

  test("handles missing catalog entries", () => {
    const counts = {
      "bin-unknown": 1,
    };

    const bom = computeBom(counts, lookupBin);

    expect(bom.items).toHaveLength(1);
    expect(bom.items[0].binId).toBe(parseId("bin-unknown"));
    expect(bom.totalPrice).toBe(0);
    expect(bom.isApproximatePrice).toBe(true);
  });

  test("handles zero-price bins (e.g. 3D printed)", () => {
    const counts = {
      "gridfinity-1": 5,
    };

    const bom = computeBom(counts, lookupBin);

    expect(bom.items).toHaveLength(1);
    expect(bom.totalPrice).toBe(0);
    expect(bom.isApproximatePrice).toBe(true);
  });

  test("ignores zero quantities", () => {
    const counts = {
      "bin-1": 0,
      "bin-2": 2,
    };

    const bom = computeBom(counts, lookupBin);

    expect(bom.items).toHaveLength(1);
    expect(bom.items[0].binId).toBe(parseId("bin-2"));
    expect(bom.totalPrice).toBe(30);
  });

  test("returns empty BOM for empty result", () => {
    const counts = {};
    const bom = computeBom(counts, lookupBin);

    expect(bom.items).toHaveLength(0);
    expect(bom.totalPrice).toBe(0);
    expect(bom.isApproximatePrice).toBe(false);
  });
});
