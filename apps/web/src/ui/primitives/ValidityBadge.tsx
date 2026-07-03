import React from "react";
import type { ValidityState } from "@storagemaxxing/assembly/PackingResult";

export type ValidityBadgeProps = {
  readonly isFeasible?: boolean;
  readonly packingValidity?: ValidityState;
};

type BadgeStyle = {
  readonly label: string;
  readonly className: string;
};

const getBadgeStyle = (
  isFeasible?: boolean,
  packingValidity?: ValidityState,
): BadgeStyle => {
  return isFeasible === false || packingValidity === "invalid"
    ? { label: "Invalid", className: "border-red-700 bg-red-50 text-red-700" }
    : packingValidity === "partial"
      ? {
          label: "Partial",
          className: "border-amber-700 bg-amber-50 text-amber-700",
        }
      : packingValidity === "valid" || isFeasible === true
        ? {
            label: "Valid",
            className: "border-green-700 bg-green-50 text-green-700",
          }
        : {
            label: "Unknown",
            className: "border-border-strong bg-surface-hover text-text-secondary",
          };
};

export const ValidityBadge: React.FC<ValidityBadgeProps> = ({
  isFeasible,
  packingValidity,
}) => {
  const style = getBadgeStyle(isFeasible, packingValidity);

  return (
    <span
      className={`inline-block rounded-sm border px-2 py-1 text-sm font-bold ${style.className}`}
    >
      {style.label}
    </span>
  );
};
