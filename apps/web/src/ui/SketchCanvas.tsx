import React, { useRef, useEffect } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { binId } from "@storagemaxxing/catalog/bin";
import { useSketchEvents } from "./SketchCanvasHooks";
import { drawCanvas } from "./SketchCanvasDrawing";

// eslint-disable-next-line complexity
export const SketchCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mode = useStore((state) => state.mode);
  const pan = useStore((state) => state.pan);

  const activeSketchId = useStore((state) => state.activeSketchId);
  const sketches = useStore((state) => state.sketches);
  const activeSketch = sketches.find((s) => s.id === activeSketchId) || null;

  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const spaces = useStore((state) => state.spaces);
  const packingResultsBySpace = useStore(
    (state) => state.packingResultsBySpace,
  );

  const activeSpace = activeSpaceId
    ? spaces.find((s) => s.id === activeSpaceId) || null
    : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const constraints = activeSpace ? Object.values(activeSpace.constraints) : [];
  const packingResult = activeSpaceId
    ? packingResultsBySpace[activeSpaceId] || null
    : null;

  const lookupBin = (id: string) => findBinById(ALL_BINS, binId(id));

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
      activeSpace,
      constraints,
      packingResult,
      lookupBin,
      mode,
      isDrawing,
      startPoint,
      currentPoint,
      pan,
    });
  }, [
    activeSketch,
    activeSpace,
    constraints,
    packingResult,
    isDrawing,
    startPoint,
    currentPoint,
    mode,
    pan,
  ]);

  if (!activeSketch && !activeSpace) {
    return (
      <div style={{ padding: "2rem", color: "#666" }}>
        Select or create a sketch, or select a space to view.
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
