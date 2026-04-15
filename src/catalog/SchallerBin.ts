import { z } from 'zod';
import { BasePartSchema } from './BasePart.js';

export const FreeSpaceBinSchema = BasePartSchema.extend({});

export type FreeSpaceBin = z.infer<typeof FreeSpaceBinSchema>;

export const SchallerBinSchema = FreeSpaceBinSchema.extend({
  system: z.literal('Schaller'),
  color: z.enum(['red', 'yellow', 'blue', 'grey', 'green', 'black']),
  drawerFraction: z.string().optional(), // e.g. "1/2", "1/4" for reference
  labelHolder: z.boolean(),
});

export type SchallerBin = z.infer<typeof SchallerBinSchema>;
