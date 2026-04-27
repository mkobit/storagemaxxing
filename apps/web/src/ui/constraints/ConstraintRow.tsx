import React from "react";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint.js";

export type ConstraintRowProps = {
  readonly constraint: SpaceConstraint;
  readonly binName: string;
  readonly onChange: (constraint: SpaceConstraint) => void;
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
  lo: constraint.mode === "hard" || constraint.mode === "soft" ? constraint.lo : 1,
  hi: constraint.mode === "hard" || constraint.mode === "soft" ? constraint.hi : null,
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
  hi: constraint.mode === "hard" || constraint.mode === "soft" ? constraint.hi : null,
  hard: true,
  color: constraint.color,
});

const modeHandlers: Readonly<
  Record<string, (constraint: SpaceConstraint) => SpaceConstraint>
> = {
  off: handleOffMode,
  auto: handleAutoMode,
  soft: handleSoftMode,
  hard: handleHardMode,
};

const updateBound = (
  constraint: SpaceConstraint,
  updates: { readonly lo?: number; readonly hi?: number | null },
): SpaceConstraint | undefined => {
  if (constraint.mode === "soft" || constraint.mode === "hard") {
    return { ...constraint, ...updates };
  }
  return undefined;
};

export const ConstraintRow: React.FC<ConstraintRowProps> = ({
  constraint,
  binName,
  onChange,
}) => {
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const handler = modeHandlers[e.target.value];
    if (handler !== undefined) {
      onChange(handler(constraint));
    }
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      return;
    }

    const minLo = constraint.mode === "hard" ? 1 : 0;
    const updated = updateBound(constraint, { lo: Math.max(minLo, val) });
    if (updated !== undefined) {
      onChange(updated);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parsed = parseInt(val, 10);
    const newHi = isNaN(parsed) ? null : parsed;

    const updated = updateBound(constraint, { hi: newHi });
    if (updated !== undefined) {
      onChange(updated);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        marginBottom: "0.5rem",
      }}
    >
      <span
        style={{
          width: "200px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {binName}
      </span>
      <select value={constraint.mode} onChange={handleModeChange}>
        <option value="off">Off</option>
        <option value="auto">Auto</option>
        <option value="soft">Soft</option>
        <option value="hard">Hard</option>
      </select>

      {(constraint.mode === "soft" || constraint.mode === "hard") && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            Min:
            <input
              type="number"
              min={constraint.mode === "hard" ? 1 : 0}
              value={constraint.lo}
              onChange={handleMinChange}
              style={{ width: "60px" }}
            />
          </label>
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            Max:
            <input
              type="number"
              min={constraint.lo}
              value={constraint.hi ?? ""}
              onChange={handleMaxChange}
              placeholder="none"
              style={{ width: "60px" }}
            />
          </label>
        </div>
      )}
    </div>
  );
};
