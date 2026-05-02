import React from "react";
import { useStore } from "@storagemaxxing/store/useStore.js";
import { createSketch2D } from "@storagemaxxing/assembly/Sketch2D.js";
import { createSketchId, SketchId } from "@storagemaxxing/assembly/SketchId.js";
import {
  createFeatureId,
  createSketchFeature,
  createFillSpaceFeature,
  SketchFeature,
  FeatureId,
} from "@storagemaxxing/assembly/Feature.js";
import { FeatureItem } from "./FeatureItem";

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
    addFeature(createSketchFeature(featureId, `Sketch Feature ${sketchCount + 1}`, sketchId));
    setActiveFeatureId(featureId);
    setActiveSketchId(sketchId);
  };

  const handleAddFillSpaceFeature = () => {
    const activeSketchFeature = timeline.find((f): f is SketchFeature => f.id === activeFeatureId && f.type === "sketch");
    if (!activeSketchFeature) {
      alert("Please select a Sketch Feature first to create a Fill Space from it.");
      return;
    }
    const featureId = createFeatureId();
    const fillCount = timeline.filter((f) => f.type === "fill_space").length;
    addFeature(createFillSpaceFeature(featureId, `Fill Space ${fillCount + 1}`, activeSketchFeature.sketchId));
    setActiveFeatureId(featureId);
  };

  const handleSelectFeature = (id: FeatureId, type: string, sketchId?: SketchId) => {
    setActiveFeatureId(id);
    setActiveSketchId(type === "sketch" && sketchId ? sketchId : null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "250px", borderRight: "1px solid #ccc", padding: "1rem", background: "#fafafa" }}>
      <h3>Timeline / Features</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={handleAddSketchFeature} style={{ flex: 1 }}>+ Sketch</button>
        <button onClick={handleAddFillSpaceFeature} style={{ flex: 1 }}>+ Fill Space</button>
      </div>
      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
        {timeline.map((feature) => (
          <FeatureItem key={feature.id} feature={feature} activeFeatureId={activeFeatureId} onSelect={handleSelectFeature} />
        ))}
      </ul>
      {timeline.length === 0 && <div style={{ color: "#888", fontSize: "0.9rem", textAlign: "center", marginTop: "2rem" }}>Timeline is empty. Start by creating a sketch.</div>}
    </div>
  );
};
