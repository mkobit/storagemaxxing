import { z } from 'zod';
import { AssemblySchema } from './Assembly.js';

export const ProjectIdSchema = z.string().brand<'ProjectId'>();
export type ProjectId = z.infer<typeof ProjectIdSchema>;

export const ProjectSchema = z.object({
  id: ProjectIdSchema,
  name: z.string(),
  assemblies: z.array(AssemblySchema).readonly(),
  budgetCap: z.number().nonnegative().nullable(),
  notes: z.string()
}).readonly();

export type Project = z.infer<typeof ProjectSchema>;
