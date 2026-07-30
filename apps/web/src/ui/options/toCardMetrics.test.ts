import { describe, expect, test } from "bun:test";
import { toCardMetrics } from "./toCardMetrics";
import {
  createPackingResult,
  createPackingMetrics,
} from "@storagemaxxing/assembly/PackingResult";

describe("toCardMetrics", () => {
  test("derives utilization percent, bin count, and SKU count from placedCounts", () => {
    const result = createPackingResult(
      [],
      createPackingMetrics({ "sku-a": 3, "sku-b": 2 }, 0.75, []),
      "valid",
    );

    expect(toCardMetrics(result)).toEqual({
      utilizationPct: 75,
      binCount: 5,
      skuCount: 2,
    });
  });

  test("zero placements yields zero metrics without throwing", () => {
    const result = createPackingResult(
      [],
      createPackingMetrics({}, 0, []),
      "valid",
    );

    expect(toCardMetrics(result)).toEqual({
      utilizationPct: 0,
      binCount: 0,
      skuCount: 0,
    });
  });

  test("a zero-count SKU entry is excluded from skuCount", () => {
    const result = createPackingResult(
      [],
      createPackingMetrics({ "sku-a": 0, "sku-b": 4 }, 0.5, []),
      "valid",
    );

    expect(toCardMetrics(result).skuCount).toBe(1);
  });
});
