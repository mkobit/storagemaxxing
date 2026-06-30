import React, { useState } from "react";
import { Toolbar } from "./Toolbar";
import { LayoutCanvas } from "./LayoutCanvas";
import { useStore } from "@storagemaxxing/store/useStore";
import { BOMPanel } from "./BOMPanel";
import { ConstraintEditorPanel } from "./ConstraintEditorPanel";

export const App: React.FC = () => {
  const hasHydrated = useStore((state) => state._hasHydrated);
  const [activeTab, setActiveTab] = useState<"layout" | "bom">("layout");

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
          style={{ fontWeight: activeTab === "layout" ? "bold" : "normal" }}
          onClick={() => setActiveTab("layout")}
        >
          Layout
        </button>
        <button
          style={{ fontWeight: activeTab === "bom" ? "bold" : "normal" }}
          onClick={() => setActiveTab("bom")}
        >
          BOM
        </button>
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ConstraintEditorPanel />
        <div
          style={{
            display: activeTab === "layout" ? "flex" : "none",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <LayoutCanvas />
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
