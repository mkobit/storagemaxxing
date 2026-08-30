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

// PRD §5.6 / docs/jules/constraints.md §1.2: openGrid base unit is 28mm,
// interoperable with Gridfinity's 42mm unit at a 3:2 ratio (84mm common multiple).
const OPENGRID_BASE_MM = 28;

// Compartments are formed by 3mm dividers slotted between connectors, so the
// usable footprint is one divider thickness smaller than the nominal grid
// span -- mirrors how Gridfinity subtracts its 0.5mm fit tolerance from W/D.
// Height is a single continuous cut with no material loss, so it carries no tolerance.
const DIVIDER_THICKNESS_MM = 3;

const gridDimensions = (gridW: number, gridD: number, gridH: number) => {
  const nominalW = gridW * OPENGRID_BASE_MM;
  const nominalD = gridD * OPENGRID_BASE_MM;
  const nominalH = gridH * OPENGRID_BASE_MM;

  const toleranceW = DIVIDER_THICKNESS_MM;
  const toleranceD = DIVIDER_THICKNESS_MM;
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

// Illustrative typical dimensions -- OpenGrid accessories are third-party
// designs with no single official machine-readable spec (see design.md
// Risks/Trade-offs). Every entry still packs as an ordinary grid-unit
// footprint, same as a bin.
const OPENGRID_ACCESSORIES: ReadonlyArray<BinSpec> = [
  {
    id: binId("opengrid-hook-1x1"),
    name: "openGrid Hook Panel 1x1",
    sku: "OG-ACC-HOOK",
    vendor: "openGrid",
    system: "opengrid",
    catalogSource: "builtin",
    kind: "accessory",
    accessoryType: "hook",
    price: 0,
    ...gridDimensions(1, 1, 1),
  },
  {
    id: binId("opengrid-accessory-bin-2x2x1"),
    name: "openGrid Accessory Bin 2x2x1",
    sku: "OG-ACC-BIN",
    vendor: "openGrid",
    system: "opengrid",
    catalogSource: "builtin",
    kind: "accessory",
    accessoryType: "custom",
    price: 0,
    ...gridDimensions(2, 2, 1),
  },
];

export const OPENGRID_CATALOG: ReadonlyArray<BinSpec> = [
  ...FOOTPRINTS.flatMap(([gridW, gridD]) =>
    HEIGHTS.map((gridH): BinSpec => ({
      id: binId(`opengrid-${gridW}x${gridD}x${gridH}`),
      name: `openGrid ${gridW}x${gridD}x${gridH}`,
      sku: `OG-${gridW}${gridD}${gridH}`,
      vendor: "openGrid",
      system: "opengrid",
      catalogSource: "builtin",
      kind: "bin",
      price: 0,
      ...gridDimensions(gridW, gridD, gridH),
    })),
  ),
  ...OPENGRID_ACCESSORIES,
];
