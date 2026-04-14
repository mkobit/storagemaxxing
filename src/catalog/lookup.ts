import { BinSpec, StorageSystem } from "./types";
import { Inches } from "../geometry/types";
import { SCHALLER_CATALOG } from "./schaller";
import { GRIDFINITY_CATALOG } from "./gridfinity";
import { AKROMILS_CATALOG } from "./akromils";

export const ALL_BINS: ReadonlyArray<BinSpec> = [
  ...SCHALLER_CATALOG,
  ...GRIDFINITY_CATALOG,
  ...AKROMILS_CATALOG,
];

// Find a single bin by ID — returns undefined if not found, never throws
export const findBinById = (
  catalog: ReadonlyArray<BinSpec>,
  id: string
): BinSpec | undefined => {
  return catalog.find((bin) => bin.id === id);
};

// All bins compatible with a given drawer depth
// A bin is compatible if bin.nominalH <= maxDepth
export const binsForDepth = (
  catalog: ReadonlyArray<BinSpec>,
  maxDepth: Inches
): ReadonlyArray<BinSpec> => {
  return catalog.filter((bin) => bin.nominalH <= maxDepth);
};

// All bins for a given system
export const binsForSystem = (
  catalog: ReadonlyArray<BinSpec>,
  system: StorageSystem
): ReadonlyArray<BinSpec> => {
  return catalog.filter((bin) => bin.system === system);
};
