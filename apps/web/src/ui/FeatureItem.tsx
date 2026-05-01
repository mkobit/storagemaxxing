import React from "react";
import { Feature, FeatureId } from "@storagemaxxing/assembly/Feature.js";
import { SketchId } from "@storagemaxxing/assembly/SketchId.js";
import { ConstraintEditor } from "./constraints/ConstraintEditor";

export interface FeatureItemProps {
  readonly feature: Feature;
  readonly activeFeatureId: FeatureId | null;
  readonly onSelect: (id: FeatureId, type: string, sketchId?: SketchId) => void;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({
  feature,
  activeFeatureId,
  onSelect,
}) => {
  const isActive = feature.id === activeFeatureId;

  return (
    <li style={{ marginBottom: "0.5rem" }}>
      <button
        onClick={() =>
          onSelect(
            feature.id,
            feature.type,
            "sketchId" in feature ? feature.sketchId : undefined,
          )
        }
        style={{
          width: "100%",
          textAlign: "left",
          fontWeight: isActive ? "bold" : "normal",
          background: isActive ? "#e0e0ff" : "transparent",
          border: "1px solid",
          borderColor: isActive ? "#8888ff" : "transparent",
          borderRadius: "4px",
          padding: "0.5rem",
          cursor: "pointer",
        }}
      >
        {feature.name} <small style={{ color: "#888" }}>({feature.type})</small>
      </button>
      {isActive && feature.type === "fill_space" && (
        <ConstraintEditor featureId={feature.id} />
      )}
    </li>
  );
};
