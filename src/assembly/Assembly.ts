import { z } from 'zod'
import { UnitSchema } from './Unit.js'
import { SpaceInstanceSchema } from './SpaceInstance.js'
import { AggregateConstraintSchema, StorageCategorySchema, BinSpecIdSchema } from './BaseTypes.js'

export const AssemblyIdSchema = z.string().brand<'AssemblyId'>()
export type AssemblyId = z.infer<typeof AssemblyIdSchema>

export const AssemblySchema = z
  .object({
    id: AssemblyIdSchema,
    name: z.string(),
    units: z.array(UnitSchema).readonly(),
    standaloneSpaces: z.array(SpaceInstanceSchema).readonly(),
    aggregateConstraints: z.array(AggregateConstraintSchema).readonly(),
    globalLimits: z.record(BinSpecIdSchema, z.number().int().nonnegative().nullable()).readonly(),
    storageCategories: z.array(StorageCategorySchema).readonly().optional(),
  })
  .readonly()

export type Assembly = z.infer<typeof AssemblySchema>
