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
    expect(derived).not.toBeNull();

    const sketchConstraints = Object.values(space.constraints);
    const bins = sketchConstraints
      .map((c) => findBinById(ALL_BINS, binId(c.binId))!)
      .map(toPackInput);
    const direct = packSpace(template, bins, sketchConstraints);

    expect(derived).toEqual(direct);
    expect(direct.validity).toBe("valid");
    expect(direct.placedBins.length).toBe(GOLDEN_PATH_STARTER_BIN_IDS.length);
  });

  test("returns null when no space is active", () => {
    expect(selectPackedLayout(initialState)).toBeNull();
  });

  test("derives the aggregate BOM from selector output", () => {
    const resultsBySpace = selectPackingResultsBySpace(state);
    expect(Object.keys(resultsBySpace)).toEqual([space.id]);

    const bom = computeAggregateBom(state.spaces, resultsBySpace, (id) =>
      findBinById(ALL_BINS, binId(id)),
    );

    expect(bom.items.length).toBe(GOLDEN_PATH_STARTER_BIN_IDS.length);
    bom.items.forEach((item) => expect(item.quantity).toBe(1));
  });

  test("returns an empty record when no spaces exist", () => {
    expect(selectPackingResultsBySpace(initialState)).toEqual({});
  });
});
