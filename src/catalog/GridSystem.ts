import { z } from 'zod'
import { StorageSystemSchema } from './StorageSystem.js'
import { MillimetersSchema } from './Units.js'

export const GridSystemSchema = z.object({
  system: StorageSystemSchema,
  unitWidth: MillimetersSchema,
  unitDepth: MillimetersSchema,
  unitHeight: MillimetersSchema.optional(), // Some systems don't have a strict Z grid
})

export type GridSystem = z.infer<typeof GridSystemSchema>
