import { useState, MouseEvent, useCallback, MutableRefObject } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { createPoint2D } from "@storagemaxxing/geometry/Point2D";
import { createRect2D } from "@storagemaxxing/geometry/Rect2D";
import {
  createSketchRectangle,
  SketchElement,
} from "@storagemaxxing/assembly/SketchElement";
import { createDimensions2D } from "@storagemaxxing/geometry/Dimensions2D";
import { createSketchElementId } from "@storagemaxxing/assembly/SketchElementId";

export type Point = { readonly x: number; readonly y: number };

const handleTwoPointRect = (
  start: Point,
  current: Point,
  addElement: (el: SketchElement) => void,
) => {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const w = Math.abs(current.x - start.x);
  const h = Math.abs(current.y - start.y);

  const origin = createPoint2D(x, y);
  const dims = createDimensions2D(w, h);
  const geometry = createRect2D(origin, dims);
  addElement(createSketchRectangle(createSketchElementId(), geometry));
};

const handleCenterRect = (
  start: Point,
  current: Point,
  addElement: (el: SketchElement) => void,
) => {
  const dx = Math.abs(current.x - start.x);
  const dy = Math.abs(current.y - start.y);

  const origin = createPoint2D(start.x - dx, start.y - dy);
  const dims = createDimensions2D(dx * 2, dy * 2);
  const geometry = createRect2D(origin, dims);
  addElement(createSketchRectangle(createSketchElementId(), geometry));
};

export const useSketchEvents = (
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
) => {
  const mode = useStore((state) => state.mode);
  const pan = useStore((state) => state.pan);
  const setPan = useStore((state) => state.setPan);
  const addElement = useStore((state) => state.addElementToActiveSketch);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  // Pan state for middle mouse button
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

  const getCanvasPoint = useCallback(
    (e: MouseEvent<HTMLCanvasElement>): Point | null => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: e.clientX - rect.left - pan.x,
        y: e.clientY - rect.top - pan.y,
      };
    },
    [canvasRef, pan],
  );

  const handlePointerDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      // Middle mouse button or Spacebar (handled separately) for panning
      if (e.button === 1 || mode === "pan") {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (mode === "select") return;

      const point = getCanvasPoint(e);
      if (!point) return;
      setStartPoint(point);
      setCurrentPoint(point);
      setIsDrawing(true);
    },
    [mode, getCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (isPanning && lastPanPoint) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        setPan({ x: pan.x + dx, y: pan.y + dy });
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (!isDrawing) return;
      const point = getCanvasPoint(e);
      if (!point) return;
      setCurrentPoint(point);
    },
    [isDrawing, isPanning, lastPanPoint, pan, setPan, getCanvasPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      return;
    }

    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }

    if (mode === "two_point_rect")
      handleTwoPointRect(startPoint, currentPoint, addElement);
    else if (mode === "center_rect")
      handleCenterRect(startPoint, currentPoint, addElement);

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, isPanning, startPoint, currentPoint, mode, addElement]);

  return {
    isDrawing,
    startPoint,
    currentPoint,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
};
