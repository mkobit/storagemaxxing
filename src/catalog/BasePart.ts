import { z } from 'zod';
import { StorageSystemSchema } from './StorageSystem.js';
import { PartDimensionsSchema } from './PartDimensions.js';

export const BasePartSchema = z.object({
  id: z.string(),
  name: z.string(),
  system: StorageSystemSchema,
  boundingBox: PartDimensionsSchema,
});

export type BasePart = z.infer<typeof BasePartSchema>;
