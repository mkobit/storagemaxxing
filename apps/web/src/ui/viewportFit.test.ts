import { expect, test, describe } from "bun:test";
import { createRect2D } from "@storagemaxxing/geometry/Rect2D";
import { createPoint2D } from "@storagemaxxing/geometry/Point2D";
import { createDimensions2D } from "@storagemaxxing/geometry/Dimensions2D";
import { createDimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import { createPlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import {
  createSpaceTemplate,
  SpaceTemplate,
  SpaceTemplateId,
} from "@storagemaxxing/assembly/SpaceTemplate";
import { binId, BinSpec } from "@storagemaxxing/catalog/bin";
import { computeViewportFit, computeLayoutBounds } from "./viewportFit";

const MARGIN = 20;
const VIEWPORT = createDimensions2D(800, 600);

const testBin = (id: string, w: number, l: number, h: number): BinSpec => ({
  id: binId(id),
  name: id,
  sku: id,
  vendor: "test",
  catalogSource: "user_defined",
  kind: "bin",
  nominal: createDimensions3D(w, l, h),
  actual: createDimensions3D(w, l, h),
  tolerance: createDimensions3D(0, 0, 0),
});

describe("computeViewportFit", () => {
  test("oversized bounding box scales down to fit and centers on the free axis", () => {
    // bbox is 2000x1000 (2:1 aspect); available canvas is 760x560.
    // w-constrained: 760/2000 = 0.38; h-constrained: 560/1000 = 0.56 -> scale = 0.38 (min)
    const bbox = createRect2D(
      createPoint2D(0, 0),
      createDimensions2D(2000, 1000),
    );

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
    const bbox = createRect2D(
      createPoint2D(0, 0),
      createDimensions2D(760, 560),
    );

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
    const bbox = createRect2D(
      createPoint2D(0, 0),
      createDimensions2D(100, 100),
    );

    const fit = computeViewportFit(bbox, tinyViewport, MARGIN);

    expect(Number.isFinite(fit.scale)).toBe(true);
    expect(fit.scale).toBeGreaterThan(0);
    expect(Number.isFinite(fit.offsetX)).toBe(true);
    expect(Number.isFinite(fit.offsetY)).toBe(true);
  });
});

describe("computeLayoutBounds", () => {
  test("template-only: bounds derive from the template footprint", () => {
    const template = createSpaceTemplate(
      "space",
      createDimensions3D(24, 18, 6),
      "top",
    );

    const bounds = computeLayoutBounds(template, [], () => undefined);

    expect(bounds.origin[0]).toBe(0);
    expect(bounds.origin[1]).toBe(0);
    expect(bounds.dimensions.w).toBe(24);
    expect(bounds.dimensions.l).toBe(18);
  });

  test("bins-only: undefined template w/l falls back to the union of bin footprints", () => {
    const template: SpaceTemplate = {
      id: "footprint-only" as SpaceTemplateId,
      name: "footprint-only",
      type: "drawer",
      accessFace: "top",
      packingModel: "2d",
      installationConstraints: [],
      gridResolution: 0.5,
    };
    const bin = testBin("bin-a", 4, 3, 2);
    const placed = [createPlacedBin("bin-a", createPoint3D(2, 0, 5))];
    const lookupBin = (id: string) => (id === "bin-a" ? bin : undefined);

    const bounds = computeLayoutBounds(template, placed, lookupBin);

    expect(bounds.origin[0]).toBe(2);
    expect(bounds.origin[1]).toBe(5);
    expect(bounds.dimensions.w).toBe(4);
    expect(bounds.dimensions.l).toBe(3);
  });

  test("a bin extending outside the template bounds expands the union", () => {
    const template = createSpaceTemplate(
      "space",
      createDimensions3D(10, 10, 6),
      "top",
    );
    const bin = testBin("bin-a", 4, 4, 2);
    // Placed at (8, 8): its footprint runs from (8,8) to (12,12), beyond the 10x10 template.
    const placed = [createPlacedBin("bin-a", createPoint3D(8, 0, 8))];
    const lookupBin = (id: string) => (id === "bin-a" ? bin : undefined);

    const bounds = computeLayoutBounds(template, placed, lookupBin);

    expect(bounds.origin[0]).toBe(0);
    expect(bounds.origin[1]).toBe(0);
    expect(bounds.dimensions.w).toBe(12);
    expect(bounds.dimensions.l).toBe(12);
  });

  test("unresolved bin IDs contribute nothing to the union", () => {
    const template = createSpaceTemplate(
      "space",
      createDimensions3D(10, 10, 6),
      "top",
    );
    const placed = [createPlacedBin("missing-bin", createPoint3D(50, 0, 50))];

    const bounds = computeLayoutBounds(template, placed, () => undefined);

    expect(bounds.origin[0]).toBe(0);
    expect(bounds.origin[1]).toBe(0);
    expect(bounds.dimensions.w).toBe(10);
    expect(bounds.dimensions.l).toBe(10);
  });

  test("no template and no resolvable bins yields a 0x0 bounding box", () => {
    const bounds = computeLayoutBounds(null, [], () => undefined);

    expect(bounds.origin[0]).toBe(0);
    expect(bounds.origin[1]).toBe(0);
    expect(bounds.dimensions.w).toBe(0);
    expect(bounds.dimensions.l).toBe(0);
  });

  test("a placement with a non-finite origin is dropped, not allowed to poison the union", () => {
    const template = createSpaceTemplate(
      "space",
      createDimensions3D(10, 10, 6),
      "top",
    );
    const goodBin = testBin("good-bin", 2, 2, 2);
    const badBin = testBin("bad-bin", 4, 3, 2);
    const placed = [
      createPlacedBin("good-bin", createPoint3D(1, 0, 1)),
      // Simulates an upstream packer defect: a bin "placed" with a NaN origin
      // because its footprint could not actually fit anywhere.
      createPlacedBin("bad-bin", createPoint3D(NaN, 0, NaN)),
    ];
    const lookupBin = (id: string) =>
      id === "good-bin" ? goodBin : id === "bad-bin" ? badBin : undefined;

    const bounds = computeLayoutBounds(template, placed, lookupBin);

    expect(Number.isFinite(bounds.origin[0])).toBe(true);
    expect(Number.isFinite(bounds.origin[1])).toBe(true);
    expect(Number.isFinite(bounds.dimensions.w)).toBe(true);
    expect(Number.isFinite(bounds.dimensions.l)).toBe(true);
    // The template (10x10) still dominates the union; the bad bin contributes nothing.
    expect(bounds.dimensions.w).toBe(10);
    expect(bounds.dimensions.l).toBe(10);
  });
});
