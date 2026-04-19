import { expect, test, describe } from "bun:test";
import { ALL_BINS, findBinById, binsForDepth } from "./lookup";
import { SCHALLER_CATALOG } from "./schaller";
import { inches } from "../geometry/imperial";
import { binId } from "./index";

describe("Catalog Lookup", () => {
  test("findBinById retrieves correct bin", () => {
    const firstBin = SCHALLER_CATALOG[0];
    const found = findBinById(ALL_BINS, firstBin.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstBin.id);

    const notFound = findBinById(ALL_BINS, binId("non-existent-id"));
    expect(notFound).toBeUndefined();
  });

  test("binsForDepth filters bins correctly", () => {
    const depth2Bins = binsForDepth(SCHALLER_CATALOG, inches(2));
    expect(depth2Bins.length).toBeGreaterThan(0);
    depth2Bins.forEach((bin) => {
      expect(bin.nominal.h).toBeLessThanOrEqual(2);
    });
  });
});
