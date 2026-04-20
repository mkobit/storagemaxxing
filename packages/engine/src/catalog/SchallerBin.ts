import { z } from 'zod'
import { createBasePartSchema } from './BasePart.js'
import { MillimetersSchema } from './Units.js'

export const FreeSpaceBinSchema = createBasePartSchema(MillimetersSchema).extend({})

export type FreeSpaceBin = z.infer<typeof FreeSpaceBinSchema>

export const SchallerBinSchema = FreeSpaceBinSchema.extend({
  system: z.literal('Schaller'),
  color: z.enum(['red', 'yellow', 'blue', 'grey', 'green', 'black']),
  labelHolder: z.boolean(),
})

export type SchallerBin = z.infer<typeof SchallerBinSchema>
