import React, { useRef, useEffect } from "react";
import { useStore } from "@storagemaxxing/store/useStore.js";
import { useSketchEvents } from "./SketchCanvasHooks";
import { drawCanvas } from "./SketchCanvasDrawing";
import { useSketchCanvasData } from "./useSketchCanvasData";

const getCursor = (mode: string) => {
  if (mode === "pan") return "grab";
  if (mode === "select") return "default";
  return "crosshair";
};

export const SketchCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode = useStore((state) => state.mode);
  const pan = useStore((state) => state.pan);

  const {
    activeSketch,
    activeSpace,
    constraints,
    packingResult,
    lookupBin,
  } = useSketchCanvasData();

  const sketchEvents = useSketchEvents(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCanvas({
      canvas,
      ctx,
      activeSketch,
      activeSpace,
      constraints,
      packingResult,
      lookupBin,
      mode,
      isDrawing: sketchEvents.isDrawing,
      startPoint: sketchEvents.startPoint,
      currentPoint: sketchEvents.currentPoint,
      pan,
    });
  }, [activeSketch, activeSpace, constraints, packingResult, sketchEvents, mode, pan, lookupBin]);

  if (!activeSketch && !activeSpace) {
    return (
      <div style={{ padding: "2rem", color: "#666" }}>
        Select or create a sketch, or select a space to view.
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        border: "1px solid black",
        cursor: getCursor(mode),
        backgroundColor: "#f5f5f5",
      }}
      onPointerDown={sketchEvents.handlePointerDown}
      onPointerMove={sketchEvents.handlePointerMove}
      onPointerUp={sketchEvents.handlePointerUp}
      onPointerLeave={sketchEvents.handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
