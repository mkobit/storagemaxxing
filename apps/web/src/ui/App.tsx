import React, { useState } from "react";
import { Toolbar } from "./Toolbar";
import { SketchCanvas } from "./SketchCanvas";
import { FeatureTree } from "./FeatureTree";
import { useStore } from "@storagemaxxing/store/useStore.js";
import { BOMPanel } from "./BOMPanel";

export const App: React.FC = () => {
  const hasHydrated = useStore((state) => state._hasHydrated);
  const [activeTab, setActiveTab] = useState<"canvas" | "bom">("canvas");

  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Toolbar />
      <div
        style={{
          display: "flex",
          background: "#ddd",
          padding: "0.5rem",
          gap: "1rem",
        }}
      >
        <button
          style={{ fontWeight: activeTab === "canvas" ? "bold" : "normal" }}
          onClick={() => setActiveTab("canvas")}
        >
          Canvas
        </button>
        <button
          style={{ fontWeight: activeTab === "bom" ? "bold" : "normal" }}
          onClick={() => setActiveTab("bom")}
        >
          BOM
        </button>
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            display: activeTab === "canvas" ? "flex" : "none",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <FeatureTree />
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <SketchCanvas />
          </div>
        </div>
        <div
          style={{
            display: activeTab === "bom" ? "block" : "none",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <BOMPanel />
        </div>
      </div>
    </div>
  );
};
