import { describe, expect, test } from "bun:test";
import { applyStrategyInState } from "../src/StoreHelpers";
import { AppState, initialState } from "../src/StoreTypes";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  binId,
  type BinSpec as CatalogBinSpec,
} from "@storagemaxxing/catalog/bin";
import { inches } from "@storagemaxxing/geometry/Inches";
import {
  SpaceInstanceSchema,
  SpaceInstanceId,
} from "@storagemaxxing/assembly/SpaceInstance";

const binDims = createDimensions3D(inches(2), inches(2), inches(1));
const zeroTolerance = createDimensions3D(inches(0), inches(0), inches(0));

const gridfinityBin: CatalogBinSpec = {
  id: binId("gridfinity-bin"),
  name: "Gridfinity bin",
  sku: "GRID-1",
  vendor: "Test Vendor",
  catalogSource: "builtin",
  system: "gridfinity",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
};

const testCatalog: readonly CatalogBinSpec[] = [gridfinityBin];

const template = createSpaceTemplate(
  "shared-template",
  createDimensions3D(12, 12, 2),
  "top",
);

const buildState = (): AppState => {
  const clicked = SpaceInstanceSchema.parse({
    id: "clicked-space",
    templateId: template.id,
    name: "Clicked space",
    count: 1,
    constraints: {},
    system: "schaller",
  });
  const sibling = SpaceInstanceSchema.parse({
    id: "sibling-space",
    templateId: template.id,
    name: "Sibling space",
    count: 1,
    constraints: {},
    system: "akromils",
  });
  return {
    ...initialState,
    spaces: [clicked, sibling],
    activeSpaceId: clicked.id,
    templatesById: { [template.id]: template },
  };
};

describe("applyStrategyInState", () => {
  test("sets system on the CLICKED space (regression: templateId-first ternary previously skipped this)", () => {
    const state = buildState();

    const next = applyStrategyInState(
      state,
      "clicked-space" as SpaceInstanceId,
      "gridfinity",
      testCatalog,
    );

    const clicked = next.spaces.find((s) => s.id === "clicked-space");
    expect(clicked?.system).toBe("gridfinity");
  });

  test("mirrors the new constraint set onto a sibling space but leaves its system untouched", () => {
    const state = buildState();

    const next = applyStrategyInState(
      state,
      "clicked-space" as SpaceInstanceId,
      "gridfinity",
      testCatalog,
    );

    const sibling = next.spaces.find((s) => s.id === "sibling-space");
    expect(sibling?.system).toBe("akromils");
    expect(Object.keys(sibling?.constraints ?? {})).toEqual([gridfinityBin.id]);

    const clicked = next.spaces.find((s) => s.id === "clicked-space");
    expect(Object.keys(clicked?.constraints ?? {})).toEqual([gridfinityBin.id]);
    expect(next.constraintsBySpace[template.id]).toHaveLength(1);
  });

  test("an unknown spaceId is a no-op", () => {
    const state = buildState();

    const next = applyStrategyInState(
      state,
      "unknown-space" as SpaceInstanceId,
      "gridfinity",
      testCatalog,
    );

    expect(next.spaces).toEqual(state.spaces);
    expect(next.constraintsBySpace).toEqual(state.constraintsBySpace);
  });
});
