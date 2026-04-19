import { z } from 'zod';
import { Point3D } from '../geometry/Point3D.js';

export type PlacedBin = {
  readonly binId: string;
  readonly origin: Point3D;
};

export const PlacedBinSchema = z.object({
  binId: z.string(),
  origin: z.custom<Point3D>((val) => val instanceof Float32Array && val.length === 3),
}).readonly();

export const createPlacedBin = (binId: string, origin: Point3D): PlacedBin => ({
  binId,
  origin,
});
