import { z } from 'zod';
import { createBasePartSchema } from './BasePart.js';
import { MillimetersSchema } from './Units.js';

export const GridFootprintSchema = z.object({
  gridWidth: z.number().int().positive(),
  gridDepth: z.number().int().positive(),
  gridHeight: z.number().int().positive().optional(), // For stackable Z units
});

export type GridFootprint = z.infer<typeof GridFootprintSchema>;

export const GridConstrainedBinSchema = createBasePartSchema(MillimetersSchema).extend({
  gridFootprint: GridFootprintSchema,
});

export type GridConstrainedBin = z.infer<typeof GridConstrainedBinSchema>;
