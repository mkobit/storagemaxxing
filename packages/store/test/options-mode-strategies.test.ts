import { describe, expect, test } from "bun:test";
import { selectOptionsModeStrategies } from "../src/layoutSelectors";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  binId,
  type BinSpec as CatalogBinSpec,
} from "@storagemaxxing/catalog/bin";
import { inches } from "@storagemaxxing/geometry/Inches";

const smallBinDims = createDimensions3D(inches(2), inches(2), inches(1));
const tallBinDims = createDimensions3D(inches(2), inches(2), inches(10));
const zeroTolerance = createDimensions3D(inches(0), inches(0), inches(0));

const schallerBin: CatalogBinSpec = {
  id: binId("schaller-bin"),
  name: "Schaller bin",
  sku: "SCH-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  kind: "bin",
  system: "schaller",
  nominal: smallBinDims,
  actual: smallBinDims,
  tolerance: zeroTolerance,
};

const schallerDrillBin: CatalogBinSpec = {
  id: binId("schaller-drill-bin"),
  name: "Schaller drill-mount bin",
  sku: "SCH-2",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  kind: "bin",
  system: "schaller",
  nominal: smallBinDims,
  actual: smallBinDims,
  tolerance: zeroTolerance,
  installation: { type: "drill", description: "Requires drilling" },
};

const gridfinityBin: CatalogBinSpec = {
  id: binId("gridfinity-bin"),
  name: "Gridfinity bin (too tall for the space)",
  sku: "GRID-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  kind: "bin",
  system: "gridfinity",
  nominal: tallBinDims,
  actual: tallBinDims,
  tolerance: zeroTolerance,
};

const akromilsBin: CatalogBinSpec = {
  id: binId("akromils-bin"),
  name: "Akro-Mils bin",
  sku: "AKRO-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  kind: "bin",
  system: "akromils",
  nominal: smallBinDims,
  actual: smallBinDims,
  tolerance: zeroTolerance,
};

const testCatalog: readonly CatalogBinSpec[] = [
  schallerBin,
  schallerDrillBin,
  gridfinityBin,
  akromilsBin,
];

const template = createSpaceTemplate(
  "options-space",
  createDimensions3D(12, 12, 2),
  "top",
);

describe("selectOptionsModeStrategies", () => {
  test("returns one resolved LayoutResolution per comparable system", () => {
    const strategies = selectOptionsModeStrategies(template, testCatalog);

    expect(Object.keys(strategies).sort()).toEqual([
      "akromils",
      "gridfinity",
      "opengrid",
      "schaller",
    ]);
    Object.values(strategies).forEach((resolution) => {
      expect(resolution.kind).toBe("resolved");
    });
  });

  test("auto-fills a compatible bin without any hard/soft minimum", () => {
    const strategies = selectOptionsModeStrategies(template, testCatalog);

    const akromils = strategies.akromils;
    expect(akromils.kind).toBe("resolved");
    if (akromils.kind !== "resolved") return;
    expect(
      akromils.result.placedBins.filter((p) => p.binId === akromilsBin.id)
        .length,
    ).toBeGreaterThan(0);
  });

  test("a noDrill template excludes drill bins from every system's preview, not just one system", () => {
    const noDrillTemplate = {
      ...template,
      installationConstraints: [{ type: "noDrill" as const }],
    };

    const strategies = selectOptionsModeStrategies(
      noDrillTemplate,
      testCatalog,
    );

    const schaller = strategies.schaller;
    expect(schaller.kind).toBe("resolved");
    if (schaller.kind !== "resolved") return;
    expect(
      schaller.result.placedBins.filter((p) => p.binId === schallerDrillBin.id),
    ).toHaveLength(0);
  });

  test("a system with zero height-eligible bins resolves with zero placements, not a throw", () => {
    const strategies = selectOptionsModeStrategies(template, testCatalog);

    const gridfinity = strategies.gridfinity;
    expect(gridfinity.kind).toBe("resolved");
    if (gridfinity.kind !== "resolved") return;
    expect(gridfinity.result.placedBins).toHaveLength(0);
  });
});
