import { packSpace } from "@storagemaxxing/packer/packer";
import { toPackInput } from "@storagemaxxing/packer/PackInput";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { BinSpec as CatalogBinSpec, binId } from "@storagemaxxing/catalog/bin";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import {
  createSpaceConstraint,
  SpaceConstraint,
} from "@storagemaxxing/assembly/SpaceConstraint";
import { AppState } from "./StoreTypes";

export const isBinInstallationAllowed = (
  bin: CatalogBinSpec,
  constraints: SpaceTemplate["installationConstraints"],
): boolean =>
  !(
    bin.installation?.type === "drill" &&
    constraints.some((c) => c.type === "noDrill")
  );

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
  catalog: readonly CatalogBinSpec[],
): LayoutResolution => {
  const template = templatesById[space.templateId];
  if (template === undefined)
    return layoutResolutionMissingTemplate(space.templateId);

  const constraints = Object.values(space.constraints);
  const resolved = constraints.map((c) => {
    const bin = findBinById(catalog, binId(c.binId));
    return { constraint: c, bin };
  });

  const unresolvedBinIds: readonly string[] = resolved
    .filter((r) => r.bin === undefined)
    .map((r) => r.constraint.binId);

  // Bins that resolved against the catalog but are not allowed to be
  // installed in this space (e.g. drill-mount bins when noDrill is set)
  // are dropped from BOTH the fitting constraints and the bins list below.
  // Leaving a stale hard constraint in fittingConstraints while excluding
  // the bin from the PackInput list would make checkPhaseFailures (which
  // iterates all constraints, not just resolvable ones) report placed=0
  // against the required count and spuriously flip validity to invalid.
  const allowed = resolved.filter(
    (
      r,
    ): r is {
      readonly constraint: typeof r.constraint;
      readonly bin: CatalogBinSpec;
    } =>
      r.bin !== undefined &&
      isBinInstallationAllowed(r.bin, template.installationConstraints),
  );

  const fittingConstraints = allowed.map((r) => r.constraint);

  const bins = allowed.map((r) => r.bin).map(toPackInput);

  const result = packSpace(template, bins, fittingConstraints);
  return layoutResolutionResolved(result, unresolvedBinIds);
};

export const selectPackedLayout = (
  state: LayoutInputs,
  catalog: readonly CatalogBinSpec[] = ALL_BINS,
): LayoutResolution => {
  const space =
    state.activeSpaceId !== null
      ? state.spaces.find((s) => s.id === state.activeSpaceId)
      : undefined;
  if (space === undefined) return layoutResolutionNone();

  return resolveSpace(space, state.templatesById, catalog);
};

const COMPARABLE_SYSTEMS = [
  "schaller",
  "gridfinity",
  "akromils",
  "opengrid",
] as const;
export type ComparableStorageSystem = (typeof COMPARABLE_SYSTEMS)[number];

export const buildAutoFillConstraints = (
  template: SpaceTemplate,
  system: ComparableStorageSystem,
  catalog: readonly CatalogBinSpec[],
): {
  readonly bins: readonly CatalogBinSpec[];
  readonly constraints: readonly SpaceConstraint[];
} => {
  const compatible = catalog.filter(
    (bin) =>
      bin.system === system &&
      isBinInstallationAllowed(bin, template.installationConstraints),
  );
  return {
    bins: compatible,
    constraints: compatible.map((bin) => createSpaceConstraint(bin.id, 0, 0)),
  };
};

const resolveStrategy = (
  template: SpaceTemplate,
  system: ComparableStorageSystem,
  catalog: readonly CatalogBinSpec[],
): LayoutResolution => {
  const { bins, constraints } = buildAutoFillConstraints(
    template,
    system,
    catalog,
  );
  const result = packSpace(template, bins.map(toPackInput), constraints);
  return layoutResolutionResolved(result, []);
};

export const selectOptionsModeStrategies = (
  template: SpaceTemplate,
  catalog: readonly CatalogBinSpec[] = ALL_BINS,
): Readonly<Record<ComparableStorageSystem, LayoutResolution>> =>
  COMPARABLE_SYSTEMS.reduce(
    (acc, system) => ({
      ...acc,
      [system]: resolveStrategy(template, system, catalog),
    }),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as Readonly<Record<ComparableStorageSystem, LayoutResolution>>,
  );

export const selectPackingResultsBySpace = (
  state: SpaceInputs,
  catalog: readonly CatalogBinSpec[] = ALL_BINS,
): Readonly<Record<string, LayoutResolution>> =>
  state.spaces.reduce<Readonly<Record<string, LayoutResolution>>>(
    (acc, space) => ({
      ...acc,
      [space.id]: resolveSpace(space, state.templatesById, catalog),
    }),
    {},
  );
