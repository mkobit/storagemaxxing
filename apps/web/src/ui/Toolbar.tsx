import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";

export const Toolbar: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);

  return (
    <div
      style={{
        padding: "1rem",
        display: "flex",
        gap: "1rem",
        background: "#eee",
        borderBottom: "1px solid #ccc",
      }}
    >
      <button
        style={{ fontWeight: mode === "select" ? "bold" : "normal" }}
        onClick={() => setMode("select")}
      >
        Select
      </button>
      <button
        style={{ fontWeight: mode === "pan" ? "bold" : "normal" }}
        onClick={() => setMode("pan")}
      >
        Pan
      </button>
      <div style={{ width: "1px", background: "#ccc", margin: "0 0.5rem" }} />
      <button
        style={{ fontWeight: mode === "two_point_rect" ? "bold" : "normal" }}
        onClick={() => setMode("two_point_rect")}
      >
        2-Point Rectangle
      </button>
      <button
        style={{ fontWeight: mode === "center_rect" ? "bold" : "normal" }}
        onClick={() => setMode("center_rect")}
      >
        Center Rectangle
      </button>
    </div>
  );
};
