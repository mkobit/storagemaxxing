import React from "react";
import { Toolbar } from "./Toolbar";
import { SketchCanvas } from "./SketchCanvas";
import { FeatureTree } from "./FeatureTree";
import { useStore } from "@storagemaxxing/store/useStore";

export const App: React.FC = () => {
  const hasHydrated = useStore((state) => state._hasHydrated);

  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Toolbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <FeatureTree />
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <SketchCanvas />
        </div>
      </div>
    </div>
  );
};
