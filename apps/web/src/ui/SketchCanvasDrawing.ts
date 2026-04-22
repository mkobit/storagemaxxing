/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-loop-statements */
/* eslint-disable functional/no-let */
import { ToolMode } from "@storagemaxxing/store/ToolMode";
import { Sketch2D } from "@storagemaxxing/assembly/Sketch2D";
import { Point } from "./SketchCanvasHooks";

export type DrawContext = {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly activeSketch: Sketch2D | null;
  readonly mode: ToolMode;
  readonly isDrawing: boolean;
  readonly startPoint: Point | null;
  readonly currentPoint: Point | null;
  readonly pan: { readonly x: number; readonly y: number };
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pan: { readonly x: number; readonly y: number },
) => {
  const gridSize = 50;
  ctx.save();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  const startX = (pan.x % gridSize) - gridSize;
  const startY = (pan.y % gridSize) - gridSize;

  ctx.beginPath();
  for (let x = startX; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = startY; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Draw axes
  ctx.lineWidth = 2;

  // X Axis (Red)
  if (pan.y >= 0 && pan.y <= height) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.moveTo(0, pan.y);
    ctx.lineTo(width, pan.y);
    ctx.stroke();
  }

  // Y Axis (Green)
  if (pan.x >= 0 && pan.x <= width) {
    ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    ctx.beginPath();
    ctx.moveTo(pan.x, 0);
    ctx.lineTo(pan.x, height);
    ctx.stroke();
  }

  ctx.restore();
};

export const drawCanvas = (context: DrawContext) => {
  const {
    canvas,
    ctx,
    activeSketch,
    mode,
    isDrawing,
    startPoint,
    currentPoint,
    pan,
  } = context;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid(ctx, canvas.width, canvas.height, pan);

  ctx.save();
  ctx.translate(pan.x, pan.y);

  if (activeSketch) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    activeSketch.elements.forEach((el) => {
      if (el.type === "rectangle") {
        ctx.strokeRect(
          el.geometry.origin[0],
          el.geometry.origin[1],
          el.geometry.dimensions.w,
          el.geometry.dimensions.l,
        );
      }
    });
  }

  if (isDrawing && startPoint && currentPoint) {
    ctx.strokeStyle = "#0066cc";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (mode === "two_point_rect") {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const w = Math.abs(currentPoint.x - startPoint.x);
      const h = Math.abs(currentPoint.y - startPoint.y);
      ctx.strokeRect(x, y, w, h);
    } else if (mode === "center_rect") {
      const dx = Math.abs(currentPoint.x - startPoint.x);
      const dy = Math.abs(currentPoint.y - startPoint.y);
      ctx.strokeRect(startPoint.x - dx, startPoint.y - dy, dx * 2, dy * 2);
    }
  }

  ctx.restore();
};
