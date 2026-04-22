import React, { useRef, useEffect } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { useSketchEvents } from "./SketchCanvasHooks";
import { drawCanvas } from "./SketchCanvasDrawing";

export const SketchCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode = useStore((state) => state.mode);
  const pan = useStore((state) => state.pan);

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
      pan,
    });
  }, [activeSketch, isDrawing, startPoint, currentPoint, mode, pan]);

  if (!activeSketch) {
    return (
      <div style={{ padding: "2rem", color: "#666" }}>
        Select or create a sketch to start drawing.
      </div>
    );
  }

  const getCursor = () => {
    if (mode === "pan") return "grab";
    if (mode === "select") return "default";
    return "crosshair";
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        border: "1px solid black",
        cursor: getCursor(),
        backgroundColor: "#f5f5f5",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click if we use it later
    />
  );
};
