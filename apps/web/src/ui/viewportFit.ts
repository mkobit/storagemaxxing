import { Rect2D } from "@storagemaxxing/geometry/Rect2D";
import { Dimensions2D } from "@storagemaxxing/geometry/Dimensions2D";

export type ViewportFit = {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

export const computeViewportFit = (
  boundingBox: Rect2D,
  viewport: Dimensions2D,
  marginPx: number,
): ViewportFit => {
  const availableW = Math.max(1, viewport.w - 2 * marginPx);
  const availableH = Math.max(1, viewport.l - 2 * marginPx);
  const bboxW = boundingBox.dimensions.w;
  const bboxH = boundingBox.dimensions.l;

  const scale =
    bboxW > 0 && bboxH > 0
      ? Math.min(availableW / bboxW, availableH / bboxH)
      : bboxW > 0
        ? availableW / bboxW
        : bboxH > 0
          ? availableH / bboxH
          : 1;

  return {
    scale,
    offsetX: (viewport.w - bboxW * scale) / 2,
    offsetY: (viewport.l - bboxH * scale) / 2,
  };
};
