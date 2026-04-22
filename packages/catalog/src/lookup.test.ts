import { expect, test, describe } from "bun:test";
import { ALL_BINS, findBinById, binsForDepth } from "./lookup";
import { SCHALLER_CATALOG } from "./schaller";
import { AKROMILS_CATALOG } from "./akromils";
import { inches } from "@storagemaxxing/geometry/Inches.js";
import { binId } from "./index";

describe("Catalog Lookup", () => {
  test("AKROMILS_CATALOG has exactly 13 bins", () => {
    expect(AKROMILS_CATALOG.length).toBe(13);
  });

  test("Akro-Mils 30010 bin dimensions check", () => {
    const bin = findBinById(AKROMILS_CATALOG, binId("akromils-30010"));
    expect(bin).toBeDefined();
    if (bin) {
      expect(bin.nominal.w).toBe(inches(4));
      expect(bin.nominal.l).toBe(inches(4.125));
      expect(bin.nominal.h).toBe(inches(3));

      expect(bin.actual.w).toBe(inches(3.9));
      expect(bin.actual.l).toBe(inches(4.025));
      expect(bin.actual.h).toBe(inches(3));

      expect(bin.tolerance.w).toBe(inches(0.05));
    }
  });

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
