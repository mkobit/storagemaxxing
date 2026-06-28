import { describe, expect, test } from "bun:test";
import {
  selectPackedLayout,
  selectPackingResultsBySpace,
} from "../src/layoutSelectors";
import { toPackInput } from "@storagemaxxing/packer/PackInput";
import { computeAggregateBom } from "@storagemaxxing/assembly/bom";
import { AppState, initialState } from "../src/StoreTypes";
import { packSpace } from "@storagemaxxing/packer/packer";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";
import { GOLDEN_PATH_STARTER_BIN_IDS } from "@storagemaxxing/catalog/goldenPath";

const template = createSpaceTemplate(
  "golden-path-space",
  createDimensions3D(12, 12, 2),
  "top",
);

const constraints = GOLDEN_PATH_STARTER_BIN_IDS.map((id) =>
  createSpaceConstraint(id, 1, 0, 1),
);

const space = SpaceInstanceSchema.parse({
  id: "golden-space-1",
  templateId: template.id,
  name: "Golden space",
  count: 1,
  constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
});

const state: AppState = {
  ...initialState,
  spaces: [space],
  activeSpaceId: space.id,
  templatesById: { [template.id]: template },
};

describe("storage-layout: Store Layout Derivation", () => {
  test("derives packed layout from the active sketch", () => {
    const derived = selectPackedLayout(state);
    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;

    const sketchConstraints = Object.values(space.constraints);
    const bins = sketchConstraints
      .map((c) => findBinById(ALL_BINS, binId(c.binId))!)
      .map(toPackInput);
    const direct = packSpace(template, bins, sketchConstraints);

    expect(derived.result).toEqual(direct);
    expect(derived.unresolvedBinIds).toEqual([]);
    expect(direct.validity).toBe("valid");
    expect(direct.placedBins.length).toBe(GOLDEN_PATH_STARTER_BIN_IDS.length);
  });

  test("returns kind none when no space is active", () => {
    expect(selectPackedLayout(initialState).kind).toBe("none");
  });

  test("unresolved bin IDs are surfaced in LayoutResolution.unresolvedBinIds", () => {
    const unknownBinId = "definitely-not-a-real-bin-id";
    const spaceWithUnknownBin = SpaceInstanceSchema.parse({
      id: "space-with-unknown-bin",
      templateId: template.id,
      name: "Mixed space",
      count: 1,
      constraints: {
        ...Object.fromEntries(constraints.map((c) => [c.binId, c])),
        [unknownBinId]: createSpaceConstraint(unknownBinId, 1, 0, 1),
      },
    });

    const derived = selectPackedLayout({
      ...state,
      spaces: [spaceWithUnknownBin],
      activeSpaceId: spaceWithUnknownBin.id,
    });

    expect(derived.kind).toBe("resolved");
    if (derived.kind !== "resolved") return;
    expect(derived.unresolvedBinIds).toEqual([unknownBinId]);
    expect(derived.result.placedBins.length).toBe(
      GOLDEN_PATH_STARTER_BIN_IDS.length,
    );
  });

  test("missing template id produces LayoutResolution kind missing-template", () => {
    const spaceWithMissingTemplate = SpaceInstanceSchema.parse({
      id: "space-missing-template",
      templateId: "template-that-does-not-exist",
      name: "Broken space",
      count: 1,
      constraints: Object.fromEntries(constraints.map((c) => [c.binId, c])),
    });

    const derived = selectPackedLayout({
      spaces: [spaceWithMissingTemplate],
      activeSpaceId: spaceWithMissingTemplate.id,
      templatesById: {},
    });

    expect(derived.kind).toBe("missing-template");
    if (derived.kind !== "missing-template") return;
    expect(derived.templateId).toBe("template-that-does-not-exist");
  });

  test("derives the aggregate BOM from selector output", () => {
    const resolutionsBySpace = selectPackingResultsBySpace(state);
    expect(Object.keys(resolutionsBySpace)).toEqual([space.id]);

    const resultsForBom = Object.fromEntries(
      Object.entries(resolutionsBySpace).flatMap(([id, r]) =>
        r.kind === "resolved" ? [[id, r.result]] : [],
      ),
    );

    const bom = computeAggregateBom(state.spaces, resultsForBom, (id) =>
      findBinById(ALL_BINS, binId(id)),
    );

    expect(bom.items.length).toBe(GOLDEN_PATH_STARTER_BIN_IDS.length);
    bom.items.forEach((item) => expect(item.quantity).toBe(1));
  });

  test("returns an empty record when no spaces exist", () => {
    expect(selectPackingResultsBySpace(initialState)).toEqual({});
  });

  test("multi-space selector preserves per-space resolution", () => {
    const resolvedSpace = space;
    const brokenSpace = SpaceInstanceSchema.parse({
      id: "space-2-broken",
      templateId: "template-that-does-not-exist",
      name: "Broken space",
      count: 1,
      constraints: {},
    });

    const resolutions = selectPackingResultsBySpace({
      spaces: [resolvedSpace, brokenSpace],
      templatesById: state.templatesById,
    });

    expect(Object.keys(resolutions).sort()).toEqual(
      [resolvedSpace.id, brokenSpace.id].sort(),
    );
    expect(resolutions[resolvedSpace.id].kind).toBe("resolved");
    expect(resolutions[brokenSpace.id].kind).toBe("missing-template");
  });
});
