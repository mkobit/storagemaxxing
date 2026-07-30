// Imported by relative path, not the "@storagemaxxing/catalog/lookup" alias
// specifier: that alias resolves to this very file when E2E_DRILL_FIXTURE is
// set (vite.config.ts), so importing it here would be a self-referencing
// cycle rather than reaching the real catalog module.
import {
  ALL_BINS as REAL_ALL_BINS,
  findBinById,
  binsForDepth,
} from "../../../../packages/catalog/src/lookup";
import { binId, type BinSpec } from "@storagemaxxing/catalog/bin";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";

const binDims = createDimensions3D(2, 2, 1);
const zeroTolerance = createDimensions3D(0, 0, 0);

const drillBin: BinSpec = {
  id: binId("test-drill-bin"),
  name: "Test Drill Bin",
  sku: "TEST-DRILL-1",
  vendor: "Test Vendor",
  system: "gridfinity",
  catalogSource: "builtin",
  nominal: binDims,
  actual: binDims,
  tolerance: zeroTolerance,
  installation: { type: "drill", description: "Requires drilling" },
};

export const ALL_BINS: ReadonlyArray<BinSpec> = [...REAL_ALL_BINS, drillBin];
export { findBinById, binsForDepth };
