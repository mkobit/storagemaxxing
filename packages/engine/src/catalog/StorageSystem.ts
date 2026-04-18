import { z } from 'zod';

export const StorageSystemSchema = z.enum([
  'Schaller',
  'Gridfinity',
  'OpenGrid',
]);

export type StorageSystem = z.infer<typeof StorageSystemSchema>;
