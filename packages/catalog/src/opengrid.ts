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

export const OPENGRID_CATALOG: ReadonlyArray<BinSpec> = FOOTPRINTS.flatMap(
  ([gridW, gridD]) =>
    HEIGHTS.map((gridH) => {
      const nominalW = gridW * OPENGRID_BASE_MM;
      const nominalD = gridD * OPENGRID_BASE_MM;
      const nominalH = gridH * OPENGRID_BASE_MM;

      const toleranceW = DIVIDER_THICKNESS_MM;
      const toleranceD = DIVIDER_THICKNESS_MM;
      const toleranceH = 0;

      const actualW = nominalW - toleranceW;
      const actualD = nominalD - toleranceD;
      const actualH = nominalH - toleranceH;

      return {
        id: binId(`opengrid-${gridW}x${gridD}x${gridH}`),
        name: `openGrid ${gridW}x${gridD}x${gridH}`,
        sku: `OG-${gridW}${gridD}${gridH}`,
        vendor: "openGrid",
        system: "opengrid",
        catalogSource: "builtin",
        kind: "bin",
        price: 0,
        nominal: {
          w: inches(nominalW / 25.4),
          l: inches(nominalD / 25.4),
          h: inches(nominalH / 25.4),
        },
        actual: {
          w: inches(actualW / 25.4),
          l: inches(actualD / 25.4),
          h: inches(actualH / 25.4),
        },
        tolerance: {
          w: inches(toleranceW / 25.4),
          l: inches(toleranceD / 25.4),
          h: inches(toleranceH / 25.4),
        },
      };
    }),
);
