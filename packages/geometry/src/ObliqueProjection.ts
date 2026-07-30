import { Point3D } from "./Point3D";
import { Point2D, createPoint2D } from "./Point2D";

export type ObliqueProjection = {
  readonly angleRadians: number;
  readonly depthScale: number;
};

export const CABINET_PROJECTION: ObliqueProjection = {
  angleRadians: Math.PI / 6,
  depthScale: 0.5,
};

export const projectPoint = (proj: ObliqueProjection, p: Point3D): Point2D => {
  const screenX = p[0] + proj.depthScale * Math.cos(proj.angleRadians) * p[2];
  const screenY = p[1] + proj.depthScale * Math.sin(proj.angleRadians) * p[2];
  return createPoint2D(screenX, screenY);
};
