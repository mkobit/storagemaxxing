import React from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { createSketch2D } from "@storagemaxxing/assembly/Sketch2D";
import { createSketchId, SketchId } from "@storagemaxxing/assembly/SketchId";
import {
  createFeatureId,
  createSketchFeature,
  createFillSpaceFeature,
  SketchFeature,
  FeatureId,
} from "@storagemaxxing/assembly/Feature";
import { ConstraintEditor } from "./constraints/ConstraintEditor.js";

export const FeatureTree: React.FC = () => {
  const timeline = useStore((state) => state.timeline);
  const sketches = useStore((state) => state.sketches);
  const activeFeatureId = useStore((state) => state.activeFeatureId);
  const setActiveFeatureId = useStore((state) => state.setActiveFeatureId);
  const setActiveSketchId = useStore((state) => state.setActiveSketchId);
  const addSketch = useStore((state) => state.addSketch);
  const addFeature = useStore((state) => state.addFeature);

  const handleAddSketchFeature = () => {
    const sketchId = createSketchId();
    const name = `Sketch ${sketches.length + 1}`;
    addSketch(createSketch2D(sketchId, name, []));

    const featureId = createFeatureId();
    const sketchCount = timeline.filter((f) => f.type === "sketch").length;
    addFeature(
      createSketchFeature(
        featureId,
        `Sketch Feature ${sketchCount + 1}`,
        sketchId,
      ),
    );
    setActiveFeatureId(featureId);
    setActiveSketchId(sketchId);
  };

  const handleAddFillSpaceFeature = () => {
    // Basic implementation to create a fill space feature referencing the currently active sketch
    const activeSketchFeature = timeline.find(
      (f): f is SketchFeature =>
        f.id === activeFeatureId && f.type === "sketch",
    );
    if (!activeSketchFeature) {
      alert(
        "Please select a Sketch Feature first to create a Fill Space from it.",
      );
      return;
    }

    const featureId = createFeatureId();
    const fillCount = timeline.filter((f) => f.type === "fill_space").length;
    addFeature(
      createFillSpaceFeature(
        featureId,
        `Fill Space ${fillCount + 1}`,
        activeSketchFeature.sketchId,
      ),
    );
    setActiveFeatureId(featureId);
  };

  const handleSelectFeature = (
    featureId: FeatureId,
    type: string,
    sketchId?: SketchId,
  ) => {
    setActiveFeatureId(featureId);
    if (type === "sketch" && sketchId) {
      setActiveSketchId(sketchId);
    } else {
      setActiveSketchId(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "250px",
        borderRight: "1px solid #ccc",
        padding: "1rem",
        background: "#fafafa",
      }}
    >
      <h3>Timeline / Features</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={handleAddSketchFeature} style={{ flex: 1 }}>
          + Sketch
        </button>
        <button onClick={handleAddFillSpaceFeature} style={{ flex: 1 }}>
          + Fill Space
        </button>
      </div>
      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
        {timeline.map((feature) => (
          <li key={feature.id} style={{ marginBottom: "0.5rem" }}>
            <button
              onClick={() =>
                handleSelectFeature(
                  feature.id,
                  feature.type,
                  "sketchId" in feature ? feature.sketchId : undefined,
                )
              }
              style={{
                width: "100%",
                textAlign: "left",
                fontWeight: feature.id === activeFeatureId ? "bold" : "normal",
                background:
                  feature.id === activeFeatureId ? "#e0e0ff" : "transparent",
                border: "1px solid",
                borderColor:
                  feature.id === activeFeatureId ? "#8888ff" : "transparent",
                borderRadius: "4px",
                padding: "0.5rem",
                cursor: "pointer",
              }}
            >
              {feature.name}{" "}
              <small style={{ color: "#888" }}>({feature.type})</small>
            </button>
            {feature.id === activeFeatureId && feature.type === "fill_space" && (
              <ConstraintEditor featureId={feature.id} />
            )}
          </li>
        ))}
      </ul>
      {timeline.length === 0 && (
        <div
          style={{
            color: "#888",
            fontSize: "0.9rem",
            textAlign: "center",
            marginTop: "2rem",
          }}
        >
          Timeline is empty. Start by creating a sketch.
        </div>
      )}
    </div>
  );
};
