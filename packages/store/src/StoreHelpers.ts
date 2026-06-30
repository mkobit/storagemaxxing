import { AppState } from "./StoreTypes";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";
import { BinSpecId } from "@storagemaxxing/assembly/BaseTypes";

export const updateConstraintInState = (
  state: AppState,
  templateId: SpaceTemplateId,
  constraint: SpaceConstraint,
) => {
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
) => {
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
