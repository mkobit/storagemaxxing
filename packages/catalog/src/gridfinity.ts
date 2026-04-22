import { BinSpec, binId } from "./bin.js";
import { inches } from "@storagemaxxing/geometry/Inches.js";

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

export const GRIDFINITY_CATALOG: ReadonlyArray<BinSpec> = FOOTPRINTS.flatMap(
  ([gridW, gridD]) =>
    HEIGHTS.map((gridH) => {
      const nominalW = gridW * 42;
      const nominalD = gridD * 42;
      const nominalH = gridH * 7;

      const toleranceW = 0.5;
      const toleranceD = 0.5;
      const toleranceH = 0;

      const actualW = nominalW - toleranceW;
      const actualD = nominalD - toleranceD;
      const actualH = nominalH - toleranceH;

      return {
        id: binId(`gridfinity-${gridW}x${gridD}x${gridH}`),
        name: `Gridfinity ${gridW}x${gridD}x${gridH}`,
        sku: `GF-${gridW}${gridD}${gridH}`,
        vendor: "Gridfinity",
        system: "gridfinity",
        catalogSource: "builtin",
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
