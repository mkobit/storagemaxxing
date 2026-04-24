import React from "react";
import { FeatureId } from "@storagemaxxing/assembly/Feature";

export const ConstraintEditor: React.FC<{ readonly featureId: FeatureId }> = ({ featureId }) => {
  return (
    <div style={{ padding: "0.5rem", marginTop: "0.5rem", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}>
      Constraint Editor for {featureId}
    </div>
  );
};
