import React from "react";
import type { ValidityState } from "@storagemaxxing/packer/types.js";

export type ValidityBadgeProps = {
  readonly isFeasible?: boolean;
  readonly packingValidity?: ValidityState;
};

type BadgeStyle = {
  readonly label: string;
  readonly color: string;
  readonly bg: string;
};

const getBadgeStyle = (
  isFeasible?: boolean,
  packingValidity?: ValidityState,
): BadgeStyle => {
  return isFeasible === false || packingValidity === "invalid"
    ? { label: "Invalid", color: "#c62828", bg: "#ffebee" }
    : packingValidity === "partial"
      ? { label: "Partial", color: "#f57f17", bg: "#fffde7" }
      : packingValidity === "valid" || isFeasible === true
        ? { label: "Valid", color: "#2e7d32", bg: "#e8f5e9" }
        : { label: "Unknown", color: "#616161", bg: "#f5f5f5" };
};

export const ValidityBadge: React.FC<ValidityBadgeProps> = ({
  isFeasible,
  packingValidity,
}) => {
  const style = getBadgeStyle(isFeasible, packingValidity);

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.875rem",
        fontWeight: "bold",
        color: style.color,
        backgroundColor: style.bg,
        border: `1px solid ${style.color}`,
      }}
    >
      {style.label}
    </span>
  );
};
