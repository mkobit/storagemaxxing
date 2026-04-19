import { ToolMode } from '@storagemaxxing/engine/store/ToolMode';
import { Sketch2D } from '@storagemaxxing/engine/assembly/Sketch2D';
import { Point } from './SketchCanvasHooks';

export type DrawContext = {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly activeSketch: Sketch2D | null;
  readonly mode: ToolMode;
  readonly isDrawing: boolean;
  readonly startPoint: Point | null;
  readonly currentPoint: Point | null;
};

export const drawCanvas = (context: DrawContext) => {
  const { canvas, ctx, activeSketch, mode, isDrawing, startPoint, currentPoint } = context;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (activeSketch) {
    activeSketch.elements.forEach((el) => {
      if (el.type === 'rectangle') {
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
    if (mode === 'two_point_rect') {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const w = Math.abs(currentPoint.x - startPoint.x);
      const h = Math.abs(currentPoint.y - startPoint.y);
      ctx.strokeRect(x, y, w, h);
    } else if (mode === 'center_rect') {
      const dx = Math.abs(currentPoint.x - startPoint.x);
      const dy = Math.abs(currentPoint.y - startPoint.y);
      ctx.strokeRect(startPoint.x - dx, startPoint.y - dy, dx * 2, dy * 2);
    }
  }
};
