import { AppState } from "./StoreTypes";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { SpaceTemplateId } from "@storagemaxxing/assembly/SpaceTemplate";

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
