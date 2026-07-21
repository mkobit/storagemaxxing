import { BinSpec, BinId } from "./bin";
import { Inches } from "@storagemaxxing/geometry/Inches";
import { SCHALLER_CATALOG } from "./schaller";
import { GRIDFINITY_CATALOG } from "./gridfinity";
import { AKROMILS_CATALOG } from "./akromils";
import { OPENGRID_CATALOG } from "./opengrid";

export const ALL_BINS: ReadonlyArray<BinSpec> = [
  ...SCHALLER_CATALOG,
  ...GRIDFINITY_CATALOG,
  ...AKROMILS_CATALOG,
  ...OPENGRID_CATALOG,
];

export const findBinById = (
  catalog: ReadonlyArray<BinSpec>,
  id: BinId,
): BinSpec | undefined => {
  return catalog.find((bin) => bin.id === id);
};

export const binsForDepth = (
  catalog: ReadonlyArray<BinSpec>,
  maxDepth: Inches,
): ReadonlyArray<BinSpec> => {
  return catalog.filter((bin) => bin.nominal.h <= maxDepth);
};
