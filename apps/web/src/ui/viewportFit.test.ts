import { expect, test, describe } from "bun:test";
import { createRect2D } from "@storagemaxxing/geometry/Rect2D";
import { createPoint2D } from "@storagemaxxing/geometry/Point2D";
import { createDimensions2D } from "@storagemaxxing/geometry/Dimensions2D";
import { computeViewportFit } from "./viewportFit";

const MARGIN = 20;
const VIEWPORT = createDimensions2D(800, 600);

describe("computeViewportFit", () => {
  test("oversized bounding box scales down to fit and centers on the free axis", () => {
    // bbox is 2000x1000 (2:1 aspect); available canvas is 760x560.
    // w-constrained: 760/2000 = 0.38; h-constrained: 560/1000 = 0.56 -> scale = 0.38 (min)
    const bbox = createRect2D(createPoint2D(0, 0), createDimensions2D(2000, 1000));

    const fit = computeViewportFit(bbox, VIEWPORT, MARGIN);

    expect(fit.scale).toBeCloseTo(0.38, 10);
    // width-constrained axis touches the margin exactly: offsetX == marginPx
    expect(fit.offsetX).toBeCloseTo(MARGIN, 10);
    // free axis (height) centers: (600 - 1000*0.38) / 2 = 110
    expect(fit.offsetY).toBeCloseTo(110, 10);
  });

  test("tiny bounding box scales up and centers on the free axis", () => {
    // bbox is 10x10 (square); available canvas is 760x560.
    // w-constrained: 760/10 = 76; h-constrained: 560/10 = 56 -> scale = 56 (min)
    const bbox = createRect2D(createPoint2D(0, 0), createDimensions2D(10, 10));

    const fit = computeViewportFit(bbox, VIEWPORT, MARGIN);

    expect(fit.scale).toBeCloseTo(56, 10);
    // height-constrained axis touches the margin exactly
    expect(fit.offsetY).toBeCloseTo(MARGIN, 10);
    // free axis (width) centers: (800 - 10*56) / 2 = 120
    expect(fit.offsetX).toBeCloseTo(120, 10);
  });

  test("exact-fit bounding box scales to exactly fill the available area", () => {
    const bbox = createRect2D(createPoint2D(0, 0), createDimensions2D(760, 560));

    const fit = computeViewportFit(bbox, VIEWPORT, MARGIN);

    expect(fit.scale).toBeCloseTo(1, 10);
    expect(fit.offsetX).toBeCloseTo(MARGIN, 10);
    expect(fit.offsetY).toBeCloseTo(MARGIN, 10);
  });

  test("zero extent on one axis takes scale from the positive axis only", () => {
    // a flat horizontal line: height is 0, width is 100.
    const bbox = createRect2D(createPoint2D(0, 0), createDimensions2D(100, 0));

    const fit = computeViewportFit(bbox, VIEWPORT, MARGIN);

    expect(fit.scale).toBeCloseTo(760 / 100, 10);
    expect(Number.isFinite(fit.scale)).toBe(true);
    expect(Number.isFinite(fit.offsetX)).toBe(true);
    expect(Number.isFinite(fit.offsetY)).toBe(true);
  });

  test("zero extent on both axes yields scale 1 centered in the viewport", () => {
    const bbox = createRect2D(createPoint2D(0, 0), createDimensions2D(0, 0));

    const fit = computeViewportFit(bbox, VIEWPORT, MARGIN);

    expect(fit.scale).toBe(1);
    expect(fit.offsetX).toBeCloseTo(400, 10);
    expect(fit.offsetY).toBeCloseTo(300, 10);
  });

  test("viewport smaller than 2*marginPx clamps available extent to a minimum of 1px per axis", () => {
    const tinyViewport = createDimensions2D(30, 30);
    const bbox = createRect2D(createPoint2D(0, 0), createDimensions2D(100, 100));

    const fit = computeViewportFit(bbox, tinyViewport, MARGIN);

    expect(Number.isFinite(fit.scale)).toBe(true);
    expect(fit.scale).toBeGreaterThan(0);
    expect(Number.isFinite(fit.offsetX)).toBe(true);
    expect(Number.isFinite(fit.offsetY)).toBe(true);
  });
});
