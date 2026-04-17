import { z } from 'zod'
import { SpaceInstanceSchema } from './SpaceInstance.js'

export const UnitIdSchema = z.string().brand<'UnitId'>()
export type UnitId = z.infer<typeof UnitIdSchema>

export const UnitTypeSchema = z.enum([
  'toolChest',
  'bookshelf',
  'cabinetSystem',
  'garageShelving',
  'entryway',
  'custom',
])
export type UnitType = z.infer<typeof UnitTypeSchema>

export const UnitBackMaterialSchema = z.enum(['wood', 'particleboard', 'metal', 'drywall', 'open'])
export type UnitBackMaterial = z.infer<typeof UnitBackMaterialSchema>

export const UnitSchema = z
  .object({
    id: UnitIdSchema,
    name: z.string(),
    type: UnitTypeSchema,
    outerW: z.number().nonnegative(),
    outerH: z.number().nonnegative(),
    outerD: z.number().nonnegative(),
    wallThickness: z.number().nonnegative(),
    pillarWidth: z.number().nonnegative(),
    backWallThickness: z.number().nonnegative(),
    backMaterial: UnitBackMaterialSchema.optional(),
    spaces: z.array(SpaceInstanceSchema).readonly(),
    shelfPositions: z.array(z.number().nonnegative()).readonly().optional(),
    modelUrl: z.string().url().optional(),
  })
  .readonly()

export type Unit = z.infer<typeof UnitSchema>
