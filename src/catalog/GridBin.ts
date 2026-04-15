import { z } from 'zod';
import { BasePartSchema } from './BasePart.js';

export const GridFootprintSchema = z.object({
  gridWidth: z.number().int().positive(),
  gridDepth: z.number().int().positive(),
  gridHeight: z.number().int().positive().optional(), // For stackable Z units
});

export type GridFootprint = z.infer<typeof GridFootprintSchema>;

export const GridConstrainedBinSchema = BasePartSchema.extend({
  gridFootprint: GridFootprintSchema,
});

export type GridConstrainedBin = z.infer<typeof GridConstrainedBinSchema>;
