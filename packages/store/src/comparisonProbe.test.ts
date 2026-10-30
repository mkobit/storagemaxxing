import { describe, expect, test } from "bun:test";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { computeAggregateBom, computeBom } from "@storagemaxxing/assembly/bom";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceInstanceSchema } from "@storagemaxxing/assembly/SpaceInstance";
import { createSpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { binId, type BinSpec } from "@storagemaxxing/catalog/bin";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import {
  selectOptionsModeStrategies,
  selectPackedLayout,
  selectPackingResultsBySpace,
  type LayoutResolution,
} from "./layoutSelectors";

const template = createSpaceTemplate(
  "comparison-probe",
  createDimensions3D(4, 4, 2),
  "top",
);
const makeBin = (id: string, system: BinSpec["system"]): BinSpec => ({
  id: binId(id),
  name: id,
  sku: id,
  vendor: "Synthetic research fixture",
  catalogSource: "builtin",
  system,
  kind: "bin",
  nominal: createDimensions3D(2, 2, 1),
  actual: createDimensions3D(2, 2, 1),
  tolerance: createDimensions3D(0, 0, 0),
});
const pricedBin = { ...makeBin("priced-bin", "schaller"), price: 3 };
const unknownBin = makeBin("unknown-bin", "akromils");
const hook: BinSpec = {
  ...makeBin("hook", "gridfinity"),
  kind: "accessory",
  accessoryType: "hook",
  price: 2,
};
const tallBin = {
  ...makeBin("tall-bin", "gridfinity"),
  actual: createDimensions3D(2, 2, 3),
};
const railBin: BinSpec = {
  ...makeBin("rail-bin", "opengrid"),
  price: 5,
  installation: { type: "rail", description: "Requires a support rail" },
};
const support: BinSpec = {
  ...makeBin("support-plate", "gridfinity"),
  kind: "accessory",
  accessoryType: "blank",
  actual: createDimensions3D(4, 4, 0.25),
  price: 7,
};
const catalog: readonly BinSpec[] = [
  pricedBin,
  unknownBin,
  hook,
  tallBin,
  railBin,
];
const lookup = (id: string) =>
  [...catalog, support].find((entry) => entry.id === id);
const resultOf = (resolution: LayoutResolution) => {
  if (resolution.kind !== "resolved") {
    throw new Error(`Expected a resolved research case: ${resolution.kind}`);
  }
  return resolution.result;
};
const space = SpaceInstanceSchema.parse({
  id: "probe-space",
  templateId: template.id,
  name: "Three copies",
  count: 3,
  constraints: Object.fromEntries(
    [
      createSpaceConstraint(pricedBin.id, 1, 0, 1),
      createSpaceConstraint(hook.id, 1, 0, 1),
    ].map((constraint) => [constraint.binId, constraint]),
  ),
});
const state = {
  spaces: [space],
  activeSpaceId: space.id,
  templatesById: { [template.id]: template },
};

describe("comparison research probes", () => {
  test("records four system previews, including accessories and unknown prices", () => {
    const strategies = selectOptionsModeStrategies(template, catalog);
    expect(Object.keys(strategies)).toEqual([
      "schaller",
      "gridfinity",
      "akromils",
      "opengrid",
    ]);
    const rows = Object.entries(strategies).map(([system, resolution]) => {
      const result = resultOf(resolution);
      return {
        system,
        counts: result.metrics.placedCounts,
        area: result.metrics.areaUtilization,
        bom: computeBom(result, lookup),
      };
    });
    expect(rows).toEqual([
      {
        system: "schaller",
        counts: { "priced-bin": 4 },
        area: 1,
        bom: {
          items: [{ binId: BinSpecIdSchema.parse(pricedBin.id), quantity: 4 }],
          totalPrice: 12,
          isApproximatePrice: false,
        },
      },
      {
        system: "gridfinity",
        counts: { hook: 4 },
        area: 1,
        bom: {
          items: [{ binId: BinSpecIdSchema.parse(hook.id), quantity: 4 }],
          totalPrice: 8,
          isApproximatePrice: false,
        },
      },
      {
        system: "akromils",
        counts: { "unknown-bin": 4 },
        area: 1,
        bom: {
          items: [{ binId: BinSpecIdSchema.parse(unknownBin.id), quantity: 4 }],
          totalPrice: 0,
          isApproximatePrice: true,
        },
      },
      {
        system: "opengrid",
        counts: {},
        area: 0,
        bom: { items: [], totalPrice: 0, isApproximatePrice: false },
      },
    ]);
  });

  test("records mixed placements and purchase quantities for three copies", () => {
    const result = resultOf(selectPackedLayout(state, catalog));
    expect(result.metrics.placedCounts).toEqual({ "priced-bin": 1, hook: 1 });
    expect(result.metrics.areaUtilization).toBe(0.5);
    expect(computeBom(result, lookup)).toEqual({
      items: [
        { binId: BinSpecIdSchema.parse(pricedBin.id), quantity: 1 },
        { binId: BinSpecIdSchema.parse(hook.id), quantity: 1 },
      ],
      totalPrice: 5,
      isApproximatePrice: false,
    });
    const resolutions = selectPackingResultsBySpace(state, catalog);
    expect(
      computeAggregateBom(
        [space],
        { [space.id]: resultOf(resolutions[space.id]!) },
        lookup,
      ),
    ).toEqual({
      items: [
        { binId: BinSpecIdSchema.parse(pricedBin.id), quantity: 3 },
        { binId: BinSpecIdSchema.parse(hook.id), quantity: 3 },
      ],
      totalPrice: 15,
      isApproximatePrice: false,
    });
  });

  test("records missing, zero, approximate, and mixed price totals", () => {
    const zero = { ...pricedBin, price: 0 };
    const approximate = { ...pricedBin, priceApproximate: true };
    expect(computeBom({ "priced-bin": 2 }, () => zero)).toMatchObject({
      totalPrice: 0,
      isApproximatePrice: true,
    });
    expect(computeBom({ "priced-bin": 2 }, () => approximate)).toMatchObject({
      totalPrice: 6,
      isApproximatePrice: true,
    });
    expect(computeBom({ "missing-id": 2 }, lookup)).toEqual({
      items: [{ binId: BinSpecIdSchema.parse("missing-id"), quantity: 2 }],
      totalPrice: 0,
      isApproximatePrice: true,
    });
    expect(
      computeBom({ "priced-bin": 2, "unknown-bin": 3, hook: 1 }, lookup),
    ).toMatchObject({ totalPrice: 8, isApproximatePrice: true });
  });

  test("a support plate competes for area and is not added beneath containers", () => {
    const result = resultOf(
      selectOptionsModeStrategies(template, [...catalog, support]).gridfinity,
    );
    expect(result.metrics.placedCounts).toEqual({ "support-plate": 1 });
    expect(result.metrics.areaUtilization).toBe(1);
    expect(computeBom(result, lookup)).toEqual({
      items: [{ binId: BinSpecIdSchema.parse(support.id), quantity: 1 }],
      totalPrice: 7,
      isApproximatePrice: false,
    });
  });

  test("a rail present flag enables containers without generating a rail purchase", () => {
    const withRail = {
      ...template,
      installationConstraints: [{ type: "railPresent" as const }],
    };
    const result = resultOf(
      selectOptionsModeStrategies(withRail, catalog).opengrid,
    );
    expect(result.metrics.placedCounts).toEqual({ "rail-bin": 4 });
    expect(computeBom(result, lookup)).toEqual({
      items: [{ binId: BinSpecIdSchema.parse(railBin.id), quantity: 4 }],
      totalPrice: 20,
      isApproximatePrice: false,
    });
  });

  test("occupied area includes tolerance and does not measure interior capacity", () => {
    const tolerant = {
      ...pricedBin,
      tolerance: createDimensions3D(0.5, 0.5, 0),
    };
    const result = resultOf(
      selectOptionsModeStrategies(template, [tolerant]).schaller,
    );
    expect(result.metrics.placedCounts).toEqual({ "priced-bin": 1 });
    expect(result.metrics.areaUtilization).toBe(6.25 / 16);
  });
});
