import React, { useRef, useEffect } from "react";
import { useStore } from "@storagemaxxing/engine/store/useStore";
import { useSketchEvents } from "./SketchCanvasHooks";
import { drawCanvas } from "./SketchCanvasDrawing";

export const SketchCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode = useStore((state) => state.mode);

  const activeSketchId = useStore((state) => state.activeSketchId);
  const sketches = useStore((state) => state.sketches);
  const activeSketch = sketches.find((s) => s.id === activeSketchId) || null;

  const {
    isDrawing,
    startPoint,
    currentPoint,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSketchEvents(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCanvas({
      canvas,
      ctx,
      activeSketch,
      mode,
      isDrawing,
      startPoint,
      currentPoint,
    });
  }, [activeSketch, isDrawing, startPoint, currentPoint, mode]);

  if (!activeSketch) {
    return (
      <div style={{ padding: "2rem", color: "#666" }}>
        Select or create a sketch to start drawing.
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
        cursor: mode === "select" ? "default" : "crosshair",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};
