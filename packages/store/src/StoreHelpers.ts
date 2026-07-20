import { AppState } from "./StoreTypes";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";
import { SpaceInstanceId } from "@storagemaxxing/assembly/SpaceInstance";
import { BinSpec as CatalogBinSpec } from "@storagemaxxing/catalog/bin";
import {
  buildAutoFillConstraints,
  ComparableStorageSystem,
} from "./layoutSelectors";

export const updateConstraintInState = (
  state: AppState,
  templateId: SpaceTemplateId,
  constraint: SpaceConstraint,
): Pick<AppState, "constraintsBySpace" | "spaces"> => {
  const existing = state.constraintsBySpace[templateId] || [];
  const filtered = existing.filter((c) => c.binId !== constraint.binId);
  return {
    constraintsBySpace: {
      ...state.constraintsBySpace,
      [templateId]: [...filtered, constraint],
    },
    spaces: state.spaces.map((s) => {
      if (s.templateId !== templateId) return s;
      return {
        ...s,
        constraints: {
          ...s.constraints,
          [constraint.binId]: constraint,
        },
      };
    }),
  };
};

export const removeConstraintFromState = (
  state: AppState,
  templateId: SpaceTemplateId,
  binId: BinSpecId,
): Pick<AppState, "constraintsBySpace" | "spaces"> => {
  const existing = state.constraintsBySpace[templateId] || [];
  const filtered = existing.filter((c) => c.binId !== binId);
  return {
    constraintsBySpace: {
      ...state.constraintsBySpace,
      [templateId]: filtered,
    },
    spaces: state.spaces.map((s) => {
      if (s.templateId !== templateId) return s;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [binId]: _, ...newConstraints } = s.constraints;
      return {
        ...s,
        constraints: newConstraints,
      };
    }),
  };
};

export const applyStrategyInState = (
  state: AppState,
  spaceId: SpaceInstanceId,
  system: ComparableStorageSystem,
  catalog: readonly CatalogBinSpec[],
): Pick<AppState, "constraintsBySpace" | "spaces"> => {
  const space = state.spaces.find((s) => s.id === spaceId);
  const template = space && state.templatesById[space.templateId];
  if (space === undefined || template === undefined) {
    return {
      constraintsBySpace: state.constraintsBySpace,
      spaces: state.spaces,
    };
  }
  const { constraints } = buildAutoFillConstraints(template, system, catalog);
  const constraintsRecord = Object.fromEntries(
    constraints.map((c) => [c.binId, c]),
  );
  return {
    constraintsBySpace: {
      ...state.constraintsBySpace,
      [space.templateId]: constraints,
    },
    spaces: state.spaces.map((s) => {
      if (s.id === spaceId)
        return { ...s, system, constraints: constraintsRecord };
      if (s.templateId === space.templateId)
        return { ...s, constraints: constraintsRecord };
      return s;
    }),
  };
};

export const setTemplateDrillableInState = (
  state: AppState,
  templateId: SpaceTemplateId,
  drillable: boolean,
): Pick<AppState, "templatesById"> => {
  const template = state.templatesById[templateId];
  if (template === undefined) return { templatesById: state.templatesById };

  const withoutNoDrill = template.installationConstraints.filter(
    (c) => c.type !== "noDrill",
  );
  const installationConstraints = drillable
    ? withoutNoDrill
    : [...withoutNoDrill, { type: "noDrill" as const }];

  return {
    templatesById: {
      ...state.templatesById,
      [templateId]: { ...template, installationConstraints },
    },
  };
};
