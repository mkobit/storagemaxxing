import { describe, expect, test } from "bun:test";
import {
  isBinInstallationAllowed,
  selectPackedLayout,
  selectPackingResultsBySpace,
} from "../src/layoutSelectors";
import { AppState, initialState } from "../src/StoreTypes";
import {
  createSpaceTemplate,
  type SpaceTemplate,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  binId,
  type BinSpec as CatalogBinSpec,
} from "@storagemaxxing/catalog/bin";
import { inches } from "@storagemaxxing/geometry/Inches";

const binDims = createDimensions3D(inches(2), inches(2), inches(1));
const zeroTolerance = createDimensions3D(inches(0), inches(0), inches(0));

const drillBin: CatalogBinSpec = {
  id: binId("drill-bin"),
  name: "Wall-mounted drill bin",
  sku: "DRILL-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
  installation: { type: "drill", description: "Requires drilling" },
};

const freestandingBin: CatalogBinSpec = {
  id: binId("freestanding-bin"),
  name: "Freestanding bin",
  sku: "FREE-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
};

const noInstallationBin: CatalogBinSpec = {
  id: binId("no-installation-bin"),
  name: "Bin with no installation field",
  sku: "NONE-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
};

const railBin: CatalogBinSpec = {
  id: binId("rail-bin"),
  name: "Rail-mounted bin",
  sku: "RAIL-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
  installation: { type: "rail", description: "Mounts to a rail system" },
};

const heavyBin: CatalogBinSpec = {
  id: binId("heavy-bin"),
  name: "Heavy bin",
  sku: "HEAVY-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
  weightLbs: 30,
};

const testCatalog: readonly CatalogBinSpec[] = [
  drillBin,
  freestandingBin,
  noInstallationBin,
  railBin,
  heavyBin,
];

const noDrillConstraint = { type: "noDrill" as const };
const railPresentConstraint = { type: "railPresent" as const };
const maxWeightConstraint = (value: number) =>
  ({ type: "maxWeightLbs" as const, value }) as const;

describe("installation-constraints: isBinInstallationAllowed", () => {
  test("returns false for a drill bin when noDrill is set", () => {
    expect(isBinInstallationAllowed(drillBin, [noDrillConstraint])).toBe(false);
  });

  test("returns true for a drill bin when noDrill is not set", () => {
    expect(isBinInstallationAllowed(drillBin, [])).toBe(true);
  });

  test("returns true for a bin with no installation field regardless of noDrill", () => {
    expect(
      isBinInstallationAllowed(noInstallationBin, [noDrillConstraint]),
    ).toBe(true);
    expect(isBinInstallationAllowed(noInstallationBin, [])).toBe(true);
  });

  test("returns true for a non-drill installation type even when noDrill is set", () => {
    expect(isBinInstallationAllowed(freestandingBin, [noDrillConstraint])).toBe(
      true,
    );
  });

  test("returns false for a rail bin when railPresent is not set", () => {
    expect(isBinInstallationAllowed(railBin, [])).toBe(false);
  });

  test("returns true for a rail bin when railPresent is set", () => {
    expect(isBinInstallationAllowed(railBin, [railPresentConstraint])).toBe(
      true,
    );
  });

  test("returns true for a non-rail installation type even when railPresent is unset", () => {
    expect(isBinInstallationAllowed(drillBin, [])).toBe(true);
  });
});

describe("installation-constraints: resolveSpace filtering via selectPackedLayout", () => {
  const template = createSpaceTemplate(
    "installation-space",
    createDimensions3D(12, 12, 2),
    "top",
  );

  const buildState = (
    installationConstraints: SpaceTemplate["installationConstraints"],
  ): AppState => {
    const templateWithConstraints = {
      ...template,
      installationConstraints,
    };
    const constraint = createSpaceConstraint(drillBin.id, 1, 0, 1);
    const space = SpaceInstanceSchema.parse({
      id: "installation-space-1",
      templateId: template.id,
      name: "Installation space",
      count: 1,
      constraints: { [constraint.binId]: constraint },
    });

    return {
      ...initialState,
      spaces: [space],
      activeSpaceId: space.id,
      templatesById: { [template.id]: templateWithConstraints },
    };
  };

  test("hard constraint requiring a drill bin + noDrill set: validity unaffected, zero placements of that bin", () => {
    const state = buildState([noDrillConstraint]);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;

    expect(derived.result.validity).not.toBe("invalid");
    expect(
      derived.result.placedBins.filter((p) => p.binId === drillBin.id),
    ).toHaveLength(0);
    // Not "unresolved" either -- exclusion is intentional, not a data problem.
    expect(derived.unresolvedBinIds).toEqual([]);
  });

  test("without noDrill, the same hard constraint places the drill bin normally", () => {
    const state = buildState([]);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;

    expect(derived.result.validity).toBe("valid");
    expect(
      derived.result.placedBins.filter((p) => p.binId === drillBin.id).length,
    ).toBeGreaterThan(0);
  });

  test("a bin with no installation field is never excluded, noDrill set or not", () => {
    const templateWithNoDrill = {
      ...template,
      installationConstraints: [noDrillConstraint],
    };
    const constraint = createSpaceConstraint(noInstallationBin.id, 1, 0, 1);
    const space = SpaceInstanceSchema.parse({
      id: "installation-space-2",
      templateId: template.id,
      name: "Installation space 2",
      count: 1,
      constraints: { [constraint.binId]: constraint },
    });
    const state: AppState = {
      ...initialState,
      spaces: [space],
      activeSpaceId: space.id,
      templatesById: { [template.id]: templateWithNoDrill },
    };

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    expect(derived.result.validity).toBe("valid");
    expect(
      derived.result.placedBins.filter((p) => p.binId === noInstallationBin.id)
        .length,
    ).toBeGreaterThan(0);
  });

  test("unsetting noDrill (toggling drillable back to true) restores the drill bin to normal packing", () => {
    const excludedState = buildState([noDrillConstraint]);
    const excludedDerived = selectPackedLayout(excludedState, testCatalog);
    expect(excludedDerived.kind).toBe("resolved");
    if (excludedDerived.kind !== "resolved") return;
    expect(
      excludedDerived.result.placedBins.filter((p) => p.binId === drillBin.id),
    ).toHaveLength(0);

    const restoredState = buildState([]);
    const restoredDerived = selectPackedLayout(restoredState, testCatalog);
    expect(restoredDerived.kind).toBe("resolved");
    if (restoredDerived.kind !== "resolved") return;
    expect(restoredDerived.result.validity).toBe("valid");
    expect(
      restoredDerived.result.placedBins.filter((p) => p.binId === drillBin.id)
        .length,
    ).toBeGreaterThan(0);
  });

  test("selectPackingResultsBySpace applies the same filtering per-space", () => {
    const state = buildState([noDrillConstraint]);
    const resolutions = selectPackingResultsBySpace(state, testCatalog);

    const resolution = resolutions[state.spaces[0]?.id ?? ""];
    expect(resolution?.kind).toBe("resolved");
    if (resolution?.kind !== "resolved") return;
    expect(resolution.result.validity).not.toBe("invalid");
    expect(
      resolution.result.placedBins.filter((p) => p.binId === drillBin.id),
    ).toHaveLength(0);
  });
});

describe("installation-constraints: railPresent filtering via selectPackedLayout", () => {
  const template = createSpaceTemplate(
    "rail-space",
    createDimensions3D(12, 12, 2),
    "top",
  );

  const buildState = (
    installationConstraints: SpaceTemplate["installationConstraints"],
  ): AppState => {
    const templateWithConstraints = {
      ...template,
      installationConstraints,
    };
    const constraint = createSpaceConstraint(railBin.id, 1, 0, 1);
    const space = SpaceInstanceSchema.parse({
      id: "rail-space-1",
      templateId: template.id,
      name: "Rail space",
      count: 1,
      constraints: { [constraint.binId]: constraint },
    });

    return {
      ...initialState,
      spaces: [space],
      activeSpaceId: space.id,
      templatesById: { [template.id]: templateWithConstraints },
    };
  };

  test("hard constraint requiring a rail bin without railPresent: excluded from placement", () => {
    const state = buildState([]);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    expect(
      derived.result.placedBins.filter((p) => p.binId === railBin.id),
    ).toHaveLength(0);
    expect(derived.unresolvedBinIds).toEqual([]);
  });

  test("with railPresent set, the same hard constraint places the rail bin normally", () => {
    const state = buildState([railPresentConstraint]);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    expect(derived.result.validity).toBe("valid");
    expect(
      derived.result.placedBins.filter((p) => p.binId === railBin.id).length,
    ).toBeGreaterThan(0);
  });
});

describe("installation-constraints: maxWeightLbs aggregation via selectPackedLayout", () => {
  const template = createSpaceTemplate(
    "weight-space",
    createDimensions3D(12, 12, 2),
    "top",
  );

  const buildState = (
    installationConstraints: SpaceTemplate["installationConstraints"],
    hardMin: number,
  ): AppState => {
    const templateWithConstraints = {
      ...template,
      installationConstraints,
    };
    const constraint = createSpaceConstraint(heavyBin.id, hardMin, 0, hardMin);
    const space = SpaceInstanceSchema.parse({
      id: "weight-space-1",
      templateId: template.id,
      name: "Weight space",
      count: 1,
      constraints: { [constraint.binId]: constraint },
    });

    return {
      ...initialState,
      spaces: [space],
      activeSpaceId: space.id,
      templatesById: { [template.id]: templateWithConstraints },
    };
  };

  test("placed weight within maxWeightLbs: no weightOverflow failure", () => {
    // heavyBin is 30 lbs each; 1 placed = 30 lbs, within a 50 lb budget.
    const state = buildState([maxWeightConstraint(50)], 1);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    expect(
      derived.result.metrics.failures.some((f) => f.reason === "weightOverflow"),
    ).toBe(false);
  });

  test("placed weight exceeding maxWeightLbs: failures contains a weightOverflow entry", () => {
    // heavyBin is 30 lbs each; 3 placed = 90 lbs, over a 50 lb budget.
    const state = buildState([maxWeightConstraint(50)], 3);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    const overflow = derived.result.metrics.failures.find(
      (f) => f.reason === "weightOverflow",
    );
    expect(overflow).toBeDefined();
    if (overflow?.reason !== "weightOverflow") return;
    expect(overflow.maxWeightLbs).toBe(50);
    expect(overflow.actualWeightLbs).toBe(90);
  });

  test("without a maxWeightLbs constraint, no weightOverflow failure regardless of placed weight", () => {
    const state = buildState([], 3);

    const derived = selectPackedLayout(state, testCatalog);

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    expect(
      derived.result.metrics.failures.some((f) => f.reason === "weightOverflow"),
    ).toBe(false);
  });
});
