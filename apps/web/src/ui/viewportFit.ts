import { Rect2D, createRect2D } from "@storagemaxxing/geometry/Rect2D";
import {
  Dimensions2D,
  createDimensions2D,
} from "@storagemaxxing/geometry/Dimensions2D";
import { createPoint2D } from "@storagemaxxing/geometry/Point2D";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { PlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { BinSpec } from "@storagemaxxing/catalog/bin";

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

const unionRects = (rects: readonly Rect2D[]): Rect2D => {
  if (rects.length === 0) {
    return createRect2D(createPoint2D(0, 0), createDimensions2D(0, 0));
  }
  const minX = Math.min(...rects.map((r) => r.origin[0]));
  const minY = Math.min(...rects.map((r) => r.origin[1]));
  const maxX = Math.max(...rects.map((r) => r.origin[0] + r.dimensions.w));
  const maxY = Math.max(...rects.map((r) => r.origin[1] + r.dimensions.l));
  return createRect2D(
    createPoint2D(minX, minY),
    createDimensions2D(maxX - minX, maxY - minY),
  );
};

export const computeLayoutBounds = (
  template: SpaceTemplate | null,
  placedBins: readonly PlacedBin[],
  lookupBin: (id: string) => BinSpec | undefined,
): Rect2D => {
  const templateRect: Rect2D | undefined =
    template && template.w !== undefined && template.l !== undefined
      ? createRect2D(
          createPoint2D(0, 0),
          createDimensions2D(template.w, template.l),
        )
      : undefined;

  const binRects: readonly Rect2D[] = placedBins.flatMap((placed) => {
    const spec = lookupBin(placed.binId);
    return spec
      ? [
          createRect2D(
            createPoint2D(placed.origin[0], placed.origin[2]),
            createDimensions2D(spec.nominal.w, spec.nominal.l),
          ),
        ]
      : [];
  });

  return unionRects(templateRect ? [templateRect, ...binRects] : binRects);
};
