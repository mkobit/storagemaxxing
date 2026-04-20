import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { createSketch2D } from "@storagemaxxing/assembly/Sketch2D";
import { createSketchId } from "@storagemaxxing/assembly/SketchId";

export const SketchList: React.FC = () => {
  const sketches = useStore((state) => state.sketches);
  const activeSketchId = useStore((state) => state.activeSketchId);
  const setActiveSketchId = useStore((state) => state.setActiveSketchId);
  const addSketch = useStore((state) => state.addSketch);

  const handleAddSketch = () => {
    const id = createSketchId();
    const name = `Sketch ${sketches.length + 1}`;
    addSketch(createSketch2D(id, name, []));
    setActiveSketchId(id);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "200px",
        borderRight: "1px solid #ccc",
        padding: "1rem",
      }}
    >
      <h3>Sketches</h3>
      <button onClick={handleAddSketch} style={{ marginBottom: "1rem" }}>
        + New Sketch
      </button>
      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
        {sketches.map((sketch) => (
          <li key={sketch.id} style={{ marginBottom: "0.5rem" }}>
            <button
              onClick={() => setActiveSketchId(sketch.id)}
              style={{
                width: "100%",
                textAlign: "left",
                fontWeight: sketch.id === activeSketchId ? "bold" : "normal",
                background:
                  sketch.id === activeSketchId ? "#eee" : "transparent",
                border: "none",
                padding: "0.5rem",
                cursor: "pointer",
              }}
            >
              {sketch.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
