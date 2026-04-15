import { z } from 'zod';
import { createMillimeters } from '../geometry/Millimeters.js';

export const MillimetersSchema = z.number().transform(createMillimeters);

export const PartDimensionsSchema = z.object({
  width: MillimetersSchema,
  height: MillimetersSchema,
  depth: MillimetersSchema,
});

export type PartDimensions = z.infer<typeof PartDimensionsSchema>;
