import { packSpace } from "@storagemaxxing/packer/packer";
import { createBinSpec, BinSpec } from "@storagemaxxing/assembly/BinSpec";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { BinSpec as CatalogBinSpec, binId } from "@storagemaxxing/catalog/bin";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { AppState } from "./StoreTypes.js";

export const toPackerBinSpec = (bin: CatalogBinSpec): BinSpec =>
  createBinSpec({
    id: bin.id,
    w: bin.actual.w,
    l: bin.actual.l,
    h: bin.actual.h,
    toleranceW: bin.tolerance.w,
    toleranceL: bin.tolerance.l,
    toleranceH: bin.tolerance.h,
  });

export const selectPackedLayout = (state: AppState): PackingResult | null => {
  const space =
    state.activeSpaceId !== null
      ? state.spaces.find((s) => s.id === state.activeSpaceId)
      : undefined;
  if (space === undefined) return null;

  const template = state.templatesById[space.templateId];
  if (template === undefined) return null;

  const constraints = Object.values(space.constraints);
  const bins = constraints
    .map((c) => findBinById(ALL_BINS, binId(c.binId)))
    .filter((b): b is CatalogBinSpec => b !== undefined)
    .map(toPackerBinSpec);

  return packSpace(template, bins, constraints);
};
