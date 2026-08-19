import { BinSpec, binId } from "./bin";
import { inches } from "@storagemaxxing/geometry/Inches";

const FOOTPRINTS = [
  [1, 1],
  [1, 2],
  [2, 1],
  [2, 2],
  [1, 3],
  [3, 1],
  [2, 3],
  [3, 2],
  [3, 3],
] as const;

const HEIGHTS = [1, 2, 3, 4] as const;

const GRID_UNIT_MM = 42;
const HEIGHT_UNIT_MM = 7;
const FIT_TOLERANCE_MM = 0.5;

const gridDimensions = (gridW: number, gridD: number, gridH: number) => {
  const nominalW = gridW * GRID_UNIT_MM;
  const nominalD = gridD * GRID_UNIT_MM;
  const nominalH = gridH * HEIGHT_UNIT_MM;

  const toleranceW = FIT_TOLERANCE_MM;
  const toleranceD = FIT_TOLERANCE_MM;
  const toleranceH = 0;

  return {
    nominal: {
      w: inches(nominalW / 25.4),
      l: inches(nominalD / 25.4),
      h: inches(nominalH / 25.4),
    },
    actual: {
      w: inches((nominalW - toleranceW) / 25.4),
      l: inches((nominalD - toleranceD) / 25.4),
      h: inches((nominalH - toleranceH) / 25.4),
    },
    tolerance: {
      w: inches(toleranceW / 25.4),
      l: inches(toleranceD / 25.4),
      h: inches(toleranceH / 25.4),
    },
  };
};

// Illustrative typical dimensions -- Gridfinity accessories are third-party
// designs with no single official machine-readable spec (see design.md
// Risks/Trade-offs). Every entry still packs as an ordinary grid-unit
// footprint, same as a bin.
const GRIDFINITY_ACCESSORIES: ReadonlyArray<BinSpec> = [
  {
    id: binId("gridfinity-hook-1x1"),
    name: "Gridfinity Hook Plate 1x1",
    sku: "GF-ACC-HOOK",
    vendor: "Gridfinity",
    system: "gridfinity",
    catalogSource: "builtin",
    kind: "accessory",
    accessoryType: "hook",
    price: 0,
    ...gridDimensions(1, 1, 1),
  },
  {
    id: binId("gridfinity-label-2x1"),
    name: "Gridfinity Label Holder 2x1",
    sku: "GF-ACC-LABEL",
    vendor: "Gridfinity",
    system: "gridfinity",
    catalogSource: "builtin",
    kind: "accessory",
    accessoryType: "label",
    price: 0,
    ...gridDimensions(2, 1, 1),
  },
  {
    id: binId("gridfinity-divider-1x1"),
    name: "Gridfinity Divider Insert 1x1",
    sku: "GF-ACC-DIVIDER",
    vendor: "Gridfinity",
    system: "gridfinity",
    catalogSource: "builtin",
    kind: "accessory",
    accessoryType: "divider",
    price: 0,
    ...gridDimensions(1, 1, 2),
  },
  {
    id: binId("gridfinity-blank-1x1"),
    name: "Gridfinity Blank Baseplate 1x1",
    sku: "GF-ACC-BLANK",
    vendor: "Gridfinity",
    system: "gridfinity",
    catalogSource: "builtin",
    kind: "accessory",
    accessoryType: "blank",
    price: 0,
    ...gridDimensions(1, 1, 1),
  },
];

export const GRIDFINITY_CATALOG: ReadonlyArray<BinSpec> = [
  ...FOOTPRINTS.flatMap(([gridW, gridD]) =>
    HEIGHTS.map((gridH): BinSpec => ({
      id: binId(`gridfinity-${gridW}x${gridD}x${gridH}`),
      name: `Gridfinity ${gridW}x${gridD}x${gridH}`,
      sku: `GF-${gridW}${gridD}${gridH}`,
      vendor: "Gridfinity",
      system: "gridfinity",
      catalogSource: "builtin",
      kind: "bin",
      price: 0,
      ...gridDimensions(gridW, gridD, gridH),
    })),
  ),
  ...GRIDFINITY_ACCESSORIES,
];
