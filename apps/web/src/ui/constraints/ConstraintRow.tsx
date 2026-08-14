import React from "react";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { ConstraintInputs } from "./ConstraintInputs";

export type ConstraintRowProps = {
  readonly constraint: SpaceConstraint;
  readonly binName: string;
  readonly onChange: (constraint: SpaceConstraint) => void;
  readonly onDelete?: () => void;
};

const handleOffMode = (constraint: SpaceConstraint): SpaceConstraint => ({
  mode: "off",
  binId: constraint.binId,
  lo: 0,
  hi: 0,
  hard: false,
  color: constraint.color,
});

const handleAutoMode = (constraint: SpaceConstraint): SpaceConstraint => ({
  mode: "auto",
  binId: constraint.binId,
  lo: 0,
  hi: null,
  hard: false,
  color: constraint.color,
});

const handleSoftMode = (constraint: SpaceConstraint): SpaceConstraint => ({
  mode: "soft",
  binId: constraint.binId,
  lo:
    constraint.mode === "hard" || constraint.mode === "soft"
      ? constraint.lo
      : 1,
  hi:
    constraint.mode === "hard" || constraint.mode === "soft"
      ? constraint.hi
      : null,
  hard: false,
  color: constraint.color,
});

const handleHardMode = (constraint: SpaceConstraint): SpaceConstraint => ({
  mode: "hard",
  binId: constraint.binId,
  lo:
    constraint.mode === "hard" || constraint.mode === "soft"
      ? Math.max(1, constraint.lo)
      : 1,
  hi:
    constraint.mode === "hard" || constraint.mode === "soft"
      ? constraint.hi
      : null,
  hard: true,
  color: constraint.color,
});

export const ConstraintRow: React.FC<ConstraintRowProps> = ({
  constraint,
  binName,
  onChange,
  onDelete,
}) => {
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value;
    if (newMode === "off") onChange(handleOffMode(constraint));
    else if (newMode === "auto") onChange(handleAutoMode(constraint));
    else if (newMode === "soft") onChange(handleSoftMode(constraint));
    else if (newMode === "hard") onChange(handleHardMode(constraint));
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;

    if (constraint.mode === "soft") {
      onChange({
        ...constraint,
        lo: Math.max(0, val),
      });
    } else if (constraint.mode === "hard") {
      onChange({
        ...constraint,
        lo: Math.max(1, val),
      });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    const hi = isNaN(parsed) ? null : parsed;

    if (constraint.mode === "soft") {
      onChange({
        ...constraint,
        hi,
      });
    } else if (constraint.mode === "hard") {
      onChange({
        ...constraint,
        hi: hi !== null ? Math.max(1, hi) : null,
      });
    }
  };

  return (
    <div className="mb-2 flex flex-col gap-1">
      <span title={binName} className="shrink-0 truncate text-text-primary">
        {binName}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={constraint.mode}
          onChange={handleModeChange}
          data-testid={`constraint-mode-${constraint.binId}`}
          aria-label={`Constraint mode for ${binName}`}
        >
          <option value="off">Off</option>
          <option value="auto">Auto</option>
          <option value="soft">Soft</option>
          <option value="hard">Hard</option>
        </select>

        <ConstraintInputs
          constraint={constraint}
          onMinChange={handleMinChange}
          onMaxChange={handleMaxChange}
        />
        {onDelete && (
          <button
            onClick={onDelete}
            className="cursor-pointer border-none bg-transparent px-2 py-0 text-xl leading-none text-status-danger"
            title="Remove constraint"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
