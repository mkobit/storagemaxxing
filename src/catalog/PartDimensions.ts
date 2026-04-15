import { z } from 'zod';

export const createPartDimensionsSchema = <T extends z.ZodTypeAny>(unitSchema: T) =>
  z.object({
    width: unitSchema,
    height: unitSchema,
    depth: unitSchema,
  });
