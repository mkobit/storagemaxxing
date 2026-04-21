import { vec3, ReadonlyVec3 } from "gl-matrix";

export type Point3D = ReadonlyVec3;

export const createPoint3D = (x: number, y: number, z: number): Point3D => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return vec3.fromValues(x, y, z) as Point3D;
};
