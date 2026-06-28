import { packSpace } from "@storagemaxxing/packer/packer";
import { toPackInput } from "@storagemaxxing/packer/PackInput";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { BinSpec as CatalogBinSpec, binId } from "@storagemaxxing/catalog/bin";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { AppState } from "./StoreTypes";

export type LayoutInputs = Pick<
  AppState,
  "spaces" | "activeSpaceId" | "templatesById"
>;

export type SpaceInputs = Pick<AppState, "spaces" | "templatesById">;

export type LayoutResolution =
  | { readonly kind: "none" }
  | { readonly kind: "missing-template"; readonly templateId: string }
  | {
      readonly kind: "resolved";
      readonly result: PackingResult;
      readonly unresolvedBinIds: readonly string[];
    };

export const layoutResolutionNone = (): LayoutResolution => ({ kind: "none" });

export const layoutResolutionMissingTemplate = (
  templateId: string,
): LayoutResolution => ({ kind: "missing-template", templateId });

export const layoutResolutionResolved = (
  result: PackingResult,
  unresolvedBinIds: readonly string[],
): LayoutResolution => ({ kind: "resolved", result, unresolvedBinIds });

const resolveSpace = (
  space: LayoutInputs["spaces"][number],
  templatesById: LayoutInputs["templatesById"],
): LayoutResolution => {
  const template = templatesById[space.templateId];
  if (template === undefined)
    return layoutResolutionMissingTemplate(space.templateId);

  const constraints = Object.values(space.constraints);
  const resolved = constraints.map((c) => {
    const bin = findBinById(ALL_BINS, binId(c.binId));
    return { constraint: c, bin };
  });

  const unresolvedBinIds: readonly string[] = resolved
    .filter((r) => r.bin === undefined)
    .map((r) => r.constraint.binId);

  const fittingConstraints = resolved
    .filter((r): r is { readonly constraint: typeof r.constraint; readonly bin: CatalogBinSpec } =>
      r.bin !== undefined,
    )
    .map((r) => r.constraint);

  const bins = resolved
    .map((r) => r.bin)
    .filter((b): b is CatalogBinSpec => b !== undefined)
    .map(toPackInput);

  const result = packSpace(template, bins, fittingConstraints);
  return layoutResolutionResolved(result, unresolvedBinIds);
};

export const selectPackedLayout = (state: LayoutInputs): LayoutResolution => {
  const space =
    state.activeSpaceId !== null
      ? state.spaces.find((s) => s.id === state.activeSpaceId)
      : undefined;
  if (space === undefined) return layoutResolutionNone();

  return resolveSpace(space, state.templatesById);
};

export const selectPackingResultsBySpace = (
  state: SpaceInputs,
): Readonly<Record<string, LayoutResolution>> =>
  state.spaces.reduce<Readonly<Record<string, LayoutResolution>>>(
    (acc, space) => ({
      ...acc,
      [space.id]: resolveSpace(space, state.templatesById),
    }),
    {},
  );
