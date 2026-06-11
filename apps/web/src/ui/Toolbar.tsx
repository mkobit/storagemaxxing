import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { GoldenPathSetup } from "./GoldenPathSetup";

export const Toolbar: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);

  return (
    <div
      className="flex gap-4 p-4 bg-gray-100 border-b border-gray-300"
      data-testid="toolbar"
    >
      <button
        className={`px-3 py-1 rounded transition-colors ${
          mode === "select"
            ? "bg-brand-primary text-white font-bold"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => setMode("select")}
        data-testid="mode-select"
      >
        Select
      </button>
      <button
        className={`px-3 py-1 rounded transition-colors ${
          mode === "pan"
            ? "bg-brand-primary text-white font-bold"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => setMode("pan")}
        data-testid="mode-pan"
      >
        Pan
      </button>
      <div className="w-px bg-gray-300 my-1 mx-2" />
      <button
        className={`px-3 py-1 rounded transition-colors ${
          mode === "two_point_rect"
            ? "bg-brand-primary text-white font-bold"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => setMode("two_point_rect")}
        data-testid="mode-two-point-rect"
      >
        2-Point Rectangle
      </button>
      <button
        className={`px-3 py-1 rounded transition-colors ${
          mode === "center_rect"
            ? "bg-brand-primary text-white font-bold"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => setMode("center_rect")}
        data-testid="mode-center-rect"
      >
        Center Rectangle
      </button>
      <div className="w-px bg-gray-300 my-1 mx-2" />
      <GoldenPathSetup />
    </div>
  );
};
