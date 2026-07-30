import { Point2D, createPoint2D } from "@storagemaxxing/geometry/Point2D";
import { createPoint3D } from "@storagemaxxing/geometry/Point3D";
import {
  CABINET_PROJECTION,
  projectPoint,
} from "@storagemaxxing/geometry/ObliqueProjection";
import { createDimensions2D } from "@storagemaxxing/geometry/Dimensions2D";
import { Rect2D, createRect2D } from "@storagemaxxing/geometry/Rect2D";
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

export type WireframeScene = {
  readonly polygons: readonly WireframePolygon[];
  readonly boundingBox: Rect2D;
};

const WIREFRAME_STROKE_TOKEN = "--color-canvas-outline";
const WIREFRAME_SURFACE_TOKEN = "--color-canvas-wireframe-surface";
const WIREFRAME_FALLBACK_FILL_TOKEN = "--color-canvas-fallback-fill";
const WIREFRAME_SPACE_STROKE_TOKEN = "--color-canvas-grid";

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

const buildSpaceEdges = (
  template: SpaceTemplate | null,
): readonly WireframePolygon[] => {
  if (!template || template.w === undefined || template.l === undefined) {
    return [];
  }
  const { w, l, h } = template;

  const floor: WireframePolygon = {
    points: [
      project(0, 0, 0),
      project(w, 0, 0),
      project(w, 0, l),
      project(0, 0, l),
    ],
    strokeToken: WIREFRAME_SPACE_STROKE_TOKEN,
  };

  if (h === undefined) return [floor];

  const top: WireframePolygon = {
    points: [
      project(0, h, 0),
      project(w, h, 0),
      project(w, h, l),
      project(0, h, l),
    ],
    strokeToken: WIREFRAME_SPACE_STROKE_TOKEN,
  };

  const verticals: readonly WireframePolygon[] = [
    {
      points: [project(0, 0, 0), project(0, h, 0)],
      strokeToken: WIREFRAME_SPACE_STROKE_TOKEN,
    },
    {
      points: [project(w, 0, 0), project(w, h, 0)],
      strokeToken: WIREFRAME_SPACE_STROKE_TOKEN,
    },
    {
      points: [project(w, 0, l), project(w, h, l)],
      strokeToken: WIREFRAME_SPACE_STROKE_TOKEN,
    },
    {
      points: [project(0, 0, l), project(0, h, l)],
      strokeToken: WIREFRAME_SPACE_STROKE_TOKEN,
    },
  ];

  return [floor, top, ...verticals];
};

// Back-to-front total order per design.md D3: farther bins (larger origin[2])
// paint first; same-depth ties break ascending on origin[0] because the
// viewer sits on the +x side, so the larger-x neighbor's front face must
// paint over the smaller-x neighbor's right face; binId is a final
// determinism tie-break (identical z/x cannot occur in a valid pack).
const compareBackToFront = (a: PlacedBin, b: PlacedBin): number => {
  if (a.origin[2] !== b.origin[2]) return b.origin[2] - a.origin[2];
  if (a.origin[0] !== b.origin[0]) return a.origin[0] - b.origin[0];
  return a.binId.localeCompare(b.binId);
};

const isFinitePoint = (point: Point2D): boolean =>
  Number.isFinite(point[0]) && Number.isFinite(point[1]);

const computeBoundingBox = (polygons: readonly WireframePolygon[]): Rect2D => {
  // A projected point derived from a non-finite placement origin (e.g. an
  // upstream packer defect placing a bin that cannot actually fit -- sm-65ad)
  // must not poison the union for every other bin and the space outline via
  // Math.min/max propagating NaN -- it is dropped here, mirroring
  // viewportFit.ts's isFiniteRect handling of non-finite placements.
  const points = polygons.flatMap((p) => p.points).filter(isFinitePoint);
  if (points.length === 0) {
    return createRect2D(createPoint2D(0, 0), createDimensions2D(0, 0));
  }
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return createRect2D(
    createPoint2D(minX, minY),
    createDimensions2D(maxX - minX, maxY - minY),
  );
};

export const buildWireframeScene = (
  result: PackingResult,
  template: SpaceTemplate | null,
  constraints: readonly SpaceConstraint[],
  lookupBin: (id: string) => BinSpec | undefined,
): WireframeScene => {
  const spaceEdges = buildSpaceEdges(template);

  const binPolygons = [...result.placedBins]
    .sort(compareBackToFront)
    .flatMap((placed) => {
      const spec = lookupBin(placed.binId);
      return spec ? buildBinFaces(placed, spec, constraints) : [];
    });

  const polygons = [...spaceEdges, ...binPolygons];

  return { polygons, boundingBox: computeBoundingBox(polygons) };
};
