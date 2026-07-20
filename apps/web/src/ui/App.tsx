import React, { useState } from "react";
import { Toolbar } from "./Toolbar";
import { LayoutCanvas } from "./LayoutCanvas";
import { useStore } from "@storagemaxxing/store/useStore";
import { BOMPanel } from "./BOMPanel";
import { ConstraintEditorPanel } from "./ConstraintEditorPanel";
import { OptionsPanel } from "./options/OptionsPanel";

export const App: React.FC = () => {
  const hasHydrated = useStore((state) => state._hasHydrated);
  const [activeTab, setActiveTab] = useState<"layout" | "bom" | "options">(
    "layout",
  );

  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <div className="flex gap-4 bg-surface-sunken p-2 text-text-primary">
        <button
          className={activeTab === "layout" ? "font-bold" : "font-normal"}
          onClick={() => setActiveTab("layout")}
        >
          Layout
        </button>
        <button
          className={activeTab === "bom" ? "font-bold" : "font-normal"}
          onClick={() => setActiveTab("bom")}
        >
          BOM
        </button>
        <button
          className={activeTab === "options" ? "font-bold" : "font-normal"}
          onClick={() => setActiveTab("options")}
        >
          Options
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ConstraintEditorPanel />
        <div
          className={
            activeTab === "layout"
              ? "flex flex-1 overflow-hidden"
              : "hidden flex-1 overflow-hidden"
          }
        >
          <LayoutCanvas />
        </div>
        <div
          className={
            activeTab === "bom"
              ? "block flex-1 overflow-hidden"
              : "hidden flex-1 overflow-hidden"
          }
        >
          <BOMPanel />
        </div>
        <div
          className={
            activeTab === "options"
              ? "block flex-1 overflow-hidden"
              : "hidden flex-1 overflow-hidden"
          }
        >
          <OptionsPanel onStrategyApplied={() => setActiveTab("layout")} />
        </div>
      </div>
    </div>
  );
};
