import { AppState } from "./StoreTypes";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";

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
