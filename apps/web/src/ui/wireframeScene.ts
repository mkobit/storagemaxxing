import { Point2D } from "@storagemaxxing/geometry/Point2D";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import {
  CABINET_PROJECTION,
  projectPoint,
} from "@storagemaxxing/geometry/ObliqueProjection";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { PlacedBin } from "@storagemaxxing/assembly/PlacedBin";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { BinSpec } from "@storagemaxxing/catalog/bin";

export type WireframePolygon = {
  readonly points: readonly Point2D[];
  readonly fillToken?: string;
  readonly fillColor?: string;
  readonly strokeToken: string;
};

const WIREFRAME_STROKE_TOKEN = "--color-canvas-outline";
const WIREFRAME_SURFACE_TOKEN = "--color-canvas-wireframe-surface";
const WIREFRAME_FALLBACK_FILL_TOKEN = "--color-canvas-fallback-fill";

const project = (x: number, y: number, z: number): Point2D =>
  projectPoint(CABINET_PROJECTION, createPoint3D(x, y, z));

const buildBinFaces = (
  placed: PlacedBin,
  spec: BinSpec,
  constraints: readonly SpaceConstraint[],
): readonly WireframePolygon[] => {
  const x0 = placed.origin[0];
  const y0 = placed.origin[1];
  const z0 = placed.origin[2];
  const x1 = x0 + spec.nominal.w;
  const y1 = y0 + spec.nominal.h;
  const z1 = z0 + spec.nominal.l;

  const constraintColor = constraints.find(
    (c) => c.binId === placed.binId,
  )?.color;

  const topFace: WireframePolygon = {
    points: [
      project(x0, y1, z0),
      project(x1, y1, z0),
      project(x1, y1, z1),
      project(x0, y1, z1),
    ],
    strokeToken: WIREFRAME_STROKE_TOKEN,
    ...(constraintColor
      ? { fillColor: constraintColor }
      : { fillToken: WIREFRAME_FALLBACK_FILL_TOKEN }),
  };

  const frontFace: WireframePolygon = {
    points: [
      project(x0, y0, z0),
      project(x1, y0, z0),
      project(x1, y1, z0),
      project(x0, y1, z0),
    ],
    fillToken: WIREFRAME_SURFACE_TOKEN,
    strokeToken: WIREFRAME_STROKE_TOKEN,
  };

  const rightFace: WireframePolygon = {
    points: [
      project(x1, y0, z0),
      project(x1, y0, z1),
      project(x1, y1, z1),
      project(x1, y1, z0),
    ],
    fillToken: WIREFRAME_SURFACE_TOKEN,
    strokeToken: WIREFRAME_STROKE_TOKEN,
  };

  return [topFace, frontFace, rightFace];
};

export const buildWireframeScene = (
  result: PackingResult,
  template: SpaceTemplate | null,
  constraints: readonly SpaceConstraint[],
  lookupBin: (id: string) => BinSpec | undefined,
): readonly WireframePolygon[] =>
  result.placedBins.flatMap((placed) => {
    const spec = lookupBin(placed.binId);
    return spec ? buildBinFaces(placed, spec, constraints) : [];
  });
