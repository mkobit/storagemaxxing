import { expect, test, describe } from "bun:test";
import { ALL_BINS, findBinById, binsForDepth, binsForSystem } from "./lookup";
import { SCHALLER_CATALOG } from "./schaller";
import { Inches } from "../geometry/types";

describe("Catalog Lookup", () => {
  test("Schaller catalog has exactly 40 entries", () => {
    expect(SCHALLER_CATALOG.length).toBe(40);
  });

  test("ALL_BINS contains Schaller bins", () => {
    expect(ALL_BINS.length).toBeGreaterThanOrEqual(40);
  });

  test("findBinById", () => {
    const firstBin = SCHALLER_CATALOG[0];
    const found = findBinById(ALL_BINS, firstBin.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstBin.id);

    const notFound = findBinById(ALL_BINS, "non-existent-id");
    expect(notFound).toBeUndefined();
  });

  test("binsForDepth", () => {
    const depth2Bins = binsForDepth(SCHALLER_CATALOG, 2 as Inches);
    expect(depth2Bins.length).toBeGreaterThan(0);
    // Ensure all returned bins have nominalH <= 2
    depth2Bins.forEach((bin) => {
      expect(bin.nominalH).toBeLessThanOrEqual(2);
    });
  });

  test("binsForSystem", () => {
    const schallerBins = binsForSystem(ALL_BINS, "schaller");
    expect(schallerBins.length).toBe(40);

    const gridfinityBins = binsForSystem(ALL_BINS, "gridfinity");
    expect(gridfinityBins.length).toBe(0); // currently a stub
  });
});
