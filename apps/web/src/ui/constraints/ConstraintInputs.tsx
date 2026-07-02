import React from "react";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";

export type ConstraintInputsProps = {
  readonly constraint: SpaceConstraint;
  readonly onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const ConstraintInputs: React.FC<ConstraintInputsProps> = ({
  constraint,
  onMinChange,
  onMaxChange,
}) => {
  if (constraint.mode !== "soft" && constraint.mode !== "hard") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <label className="flex items-center gap-1">
        Min:
        <input
          type="number"
          min={constraint.mode === "hard" ? 1 : 0}
          value={constraint.lo}
          onChange={onMinChange}
          className="w-[60px]"
        />
      </label>
      <label className="flex items-center gap-1">
        Max:
        <input
          type="number"
          min={constraint.lo}
          value={constraint.hi ?? ""}
          onChange={onMaxChange}
          placeholder="none"
          className="w-[60px]"
        />
      </label>
    </div>
  );
};
