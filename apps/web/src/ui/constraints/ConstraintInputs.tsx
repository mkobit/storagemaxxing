import React from "react";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint.js";

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
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        Min:
        <input
          type="number"
          min={constraint.mode === "hard" ? 1 : 0}
          value={constraint.lo}
          onChange={onMinChange}
          style={{ width: "60px" }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        Max:
        <input
          type="number"
          min={constraint.lo}
          value={constraint.hi ?? ""}
          onChange={onMaxChange}
          placeholder="none"
          style={{ width: "60px" }}
        />
      </label>
    </div>
  );
};
