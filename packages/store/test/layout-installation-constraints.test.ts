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

const testCatalog: readonly CatalogBinSpec[] = [
  drillBin,
  freestandingBin,
  noInstallationBin,
];

const noDrillConstraint = { type: "noDrill" as const };

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
